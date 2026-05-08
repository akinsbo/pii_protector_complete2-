// Ledebe Team Sync — Lambda API
// Handles company creation, encrypted terms sync, member management, audit
// All terms are encrypted client-side — server never sees plaintext.

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand,
  UpdateCommand, DeleteCommand, ScanCommand
} from '@aws-sdk/lib-dynamodb';
import { randomBytes, createHash } from 'crypto';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const COMPANIES = 'ledebe-companies';
const MEMBERS   = 'ledebe-members';
const AUDIT     = 'ledebe-audit';

// ── Helpers ──────────────────────────────────────────────────────────────────

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    },
    body: JSON.stringify(body),
  };
}

function hashPassword(password, salt) {
  salt = salt || randomBytes(16).toString('hex');
  const hash = createHash('sha256').update(password + salt).digest('hex');
  return { hash, salt };
}

function generateJoinCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const seg = () => Array.from({ length: 4 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
  return `${seg()}-${seg()}`;
}

function generateToken() {
  return randomBytes(24).toString('hex');
}

async function audit(companyId, action, detail, by) {
  const ts = new Date().toISOString() + '#' + randomBytes(4).toString('hex');
  await ddb.send(new PutCommand({
    TableName: AUDIT,
    Item: { companyId, timestamp: ts, action, detail, by, at: new Date().toISOString() }
  }));
}

// ── Route handler ────────────────────────────────────────────────────────────

export const handler = async (event) => {
  // CORS preflight
  if (event.requestContext?.http?.method === 'OPTIONS') {
    return json(200, {});
  }

  const method = event.requestContext?.http?.method || event.httpMethod;
  const path   = event.requestContext?.http?.path   || event.path;
  let body = {};
  try { body = event.body ? JSON.parse(event.body) : {}; } catch {}

  try {
    // ── POST /companies — register new company ───────────────────────────
    if (method === 'POST' && path === '/companies') {
      const { companyName, adminPassword, encryptedTeamKey, teamKeySalt, teamKeyIv } = body;
      if (!companyName || !adminPassword || !encryptedTeamKey) {
        return json(400, { error: 'companyName, adminPassword, encryptedTeamKey required' });
      }

      const companyId = companyName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      const existing = await ddb.send(new GetCommand({ TableName: COMPANIES, Key: { companyId } }));
      if (existing.Item) {
        return json(409, { error: 'Company already exists' });
      }

      const joinCode = generateJoinCode();
      const pw = hashPassword(adminPassword);

      await ddb.send(new PutCommand({
        TableName: COMPANIES,
        Item: {
          companyId,
          companyName,
          joinCode,
          passwordHash: pw.hash,
          passwordSalt: pw.salt,
          encryptedTeamKey,
          teamKeySalt,
          teamKeyIv,
          encryptedTerms: null,
          termsVersion: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      }));

      await audit(companyId, 'company_created', `Company "${companyName}" created`, 'admin');

      return json(201, { companyId, joinCode, message: 'Company created' });
    }

    // ── POST /auth/login — admin login ───────────────────────────────────
    if (method === 'POST' && path === '/auth/login') {
      const { companyId, adminPassword } = body;
      if (!companyId || !adminPassword) return json(400, { error: 'companyId and adminPassword required' });

      const res = await ddb.send(new GetCommand({ TableName: COMPANIES, Key: { companyId } }));
      if (!res.Item) return json(404, { error: 'Company not found' });

      const { hash } = hashPassword(adminPassword, res.Item.passwordSalt);
      if (hash !== res.Item.passwordHash) return json(401, { error: 'Invalid password' });

      // Generate session token
      const sessionToken = generateToken();
      await ddb.send(new UpdateCommand({
        TableName: COMPANIES,
        Key: { companyId },
        UpdateExpression: 'SET sessionToken = :t, sessionExpiry = :e',
        ExpressionAttributeValues: {
          ':t': sessionToken,
          ':e': new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        }
      }));

      await audit(companyId, 'login', 'Admin signed in', 'admin');

      return json(200, {
        sessionToken,
        companyId: res.Item.companyId,
        companyName: res.Item.companyName,
        joinCode: res.Item.joinCode,
        encryptedTeamKey: res.Item.encryptedTeamKey,
        teamKeySalt: res.Item.teamKeySalt,
        teamKeyIv: res.Item.teamKeyIv,
        termsVersion: res.Item.termsVersion,
      });
    }

    // ── Auth middleware for admin routes ──────────────────────────────────
    async function requireAuth() {
      const authHeader = event.headers?.authorization || event.headers?.Authorization || '';
      const token = authHeader.replace('Bearer ', '');
      if (!token) return null;

      const { companyId } = body;
      if (!companyId) return null;

      const res = await ddb.send(new GetCommand({ TableName: COMPANIES, Key: { companyId } }));
      if (!res.Item) return null;
      if (res.Item.sessionToken !== token) return null;
      if (new Date(res.Item.sessionExpiry) < new Date()) return null;

      return res.Item;
    }

    // ── PUT /terms — upload encrypted terms ──────────────────────────────
    if (method === 'PUT' && path === '/terms') {
      const company = await requireAuth();
      if (!company) return json(401, { error: 'Unauthorized' });

      const { companyId, encryptedTerms, termsIv, termCount } = body;
      if (!encryptedTerms) return json(400, { error: 'encryptedTerms required' });

      await ddb.send(new UpdateCommand({
        TableName: COMPANIES,
        Key: { companyId },
        UpdateExpression: 'SET encryptedTerms = :t, termsIv = :iv, termsVersion = termsVersion + :one, termCount = :c, updatedAt = :u',
        ExpressionAttributeValues: {
          ':t': encryptedTerms,
          ':iv': termsIv,
          ':one': 1,
          ':c': termCount || 0,
          ':u': new Date().toISOString(),
        }
      }));

      await audit(companyId, 'terms_updated', `Terms updated (${termCount || 0} terms)`, 'admin');

      return json(200, { message: 'Terms updated', version: company.termsVersion + 1 });
    }

    // ── GET /terms/{companyId} — fetch encrypted terms (for employee sync) ─
    if (method === 'GET' && path.startsWith('/terms/')) {
      const companyId = path.split('/')[2];
      if (!companyId) return json(400, { error: 'companyId required' });

      const res = await ddb.send(new GetCommand({ TableName: COMPANIES, Key: { companyId } }));
      if (!res.Item) return json(404, { error: 'Company not found' });

      return json(200, {
        encryptedTerms: res.Item.encryptedTerms,
        termsIv: res.Item.termsIv,
        termsVersion: res.Item.termsVersion,
        termCount: res.Item.termCount || 0,
        updatedAt: res.Item.updatedAt,
      });
    }

    // ── POST /join-code/regenerate ───────────────────────────────────────
    if (method === 'POST' && path === '/join-code/regenerate') {
      const company = await requireAuth();
      if (!company) return json(401, { error: 'Unauthorized' });

      const { companyId, encryptedTeamKey, teamKeySalt, teamKeyIv } = body;
      const newCode = generateJoinCode();

      await ddb.send(new UpdateCommand({
        TableName: COMPANIES,
        Key: { companyId },
        UpdateExpression: 'SET joinCode = :c, encryptedTeamKey = :k, teamKeySalt = :s, teamKeyIv = :iv, updatedAt = :u',
        ExpressionAttributeValues: {
          ':c': newCode,
          ':k': encryptedTeamKey,
          ':s': teamKeySalt,
          ':iv': teamKeyIv,
          ':u': new Date().toISOString(),
        }
      }));

      await audit(companyId, 'code_regenerated', `Join code regenerated`, 'admin');

      return json(200, { joinCode: newCode, message: 'Join code regenerated' });
    }

    // ── POST /join — employee joins with join code ───────────────────────
    if (method === 'POST' && path === '/join') {
      const { joinCode, email, deviceId } = body;
      if (!joinCode || !email) return json(400, { error: 'joinCode and email required' });

      // Find company by join code (scan — small table, fine for MVP)
      const scanRes = await ddb.send(new ScanCommand({
        TableName: COMPANIES,
        FilterExpression: 'joinCode = :code',
        ExpressionAttributeValues: { ':code': joinCode.toUpperCase() }
      }));

      if (!scanRes.Items || scanRes.Items.length === 0) {
        return json(404, { error: 'Invalid join code' });
      }

      const company = scanRes.Items[0];
      const companyId = company.companyId;
      const memberId = email.toLowerCase().replace(/[^a-z0-9@.]/g, '');
      const devId = deviceId || `dev-${randomBytes(6).toString('hex')}`;

      // Check if already a member
      const existingMember = await ddb.send(new GetCommand({
        TableName: MEMBERS,
        Key: { companyId, memberId }
      }));

      if (existingMember.Item && existingMember.Item.status === 'active') {
        // Already joined — return team key so they can re-sync
        return json(200, {
          companyId,
          companyName: company.companyName,
          encryptedTeamKey: company.encryptedTeamKey,
          teamKeySalt: company.teamKeySalt,
          teamKeyIv: company.teamKeyIv,
          alreadyMember: true,
        });
      }

      // Register new member
      await ddb.send(new PutCommand({
        TableName: MEMBERS,
        Item: {
          companyId,
          memberId,
          email: email.toLowerCase(),
          deviceId: devId,
          status: 'active',
          joinedAt: new Date().toISOString(),
          lastSeen: new Date().toISOString(),
        }
      }));

      await audit(companyId, 'member_joined', `${email} joined via join code`, email);

      return json(200, {
        companyId,
        companyName: company.companyName,
        encryptedTeamKey: company.encryptedTeamKey,
        teamKeySalt: company.teamKeySalt,
        teamKeyIv: company.teamKeyIv,
        deviceId: devId,
        alreadyMember: false,
      });
    }

    // ── GET /members/{companyId} — list members (admin) ──────────────────
    if (method === 'GET' && path.startsWith('/members/')) {
      const companyId = path.split('/')[2];
      // Auth check via query param for GET
      const authHeader = event.headers?.authorization || event.headers?.Authorization || '';
      const token = authHeader.replace('Bearer ', '');

      const companyRes = await ddb.send(new GetCommand({ TableName: COMPANIES, Key: { companyId } }));
      if (!companyRes.Item || companyRes.Item.sessionToken !== token) {
        return json(401, { error: 'Unauthorized' });
      }

      const membersRes = await ddb.send(new QueryCommand({
        TableName: MEMBERS,
        KeyConditionExpression: 'companyId = :c',
        ExpressionAttributeValues: { ':c': companyId }
      }));

      return json(200, { members: membersRes.Items || [] });
    }

    // ── DELETE /members/{companyId}/{memberId} ───────────────────────────
    if (method === 'DELETE' && path.match(/^\/members\/[^/]+\/[^/]+$/)) {
      const parts = path.split('/');
      const companyId = parts[2];
      const memberId = decodeURIComponent(parts[3]);

      const authHeader = event.headers?.authorization || event.headers?.Authorization || '';
      const token = authHeader.replace('Bearer ', '');
      const companyRes = await ddb.send(new GetCommand({ TableName: COMPANIES, Key: { companyId } }));
      if (!companyRes.Item || companyRes.Item.sessionToken !== token) {
        return json(401, { error: 'Unauthorized' });
      }

      await ddb.send(new DeleteCommand({
        TableName: MEMBERS,
        Key: { companyId, memberId }
      }));

      await audit(companyId, 'member_removed', `${memberId} removed`, 'admin');

      return json(200, { message: 'Member removed' });
    }

    // ── POST /members/{companyId}/heartbeat — device sync heartbeat ──────
    if (method === 'POST' && path.match(/^\/members\/[^/]+\/heartbeat$/)) {
      const companyId = path.split('/')[2];
      const { email } = body;
      if (!email) return json(400, { error: 'email required' });

      const memberId = email.toLowerCase().replace(/[^a-z0-9@.]/g, '');

      await ddb.send(new UpdateCommand({
        TableName: MEMBERS,
        Key: { companyId, memberId },
        UpdateExpression: 'SET lastSeen = :t',
        ExpressionAttributeValues: { ':t': new Date().toISOString() }
      }));

      return json(200, { message: 'ok' });
    }

    // ── GET /audit/{companyId} — audit log (admin) ───────────────────────
    if (method === 'GET' && path.startsWith('/audit/')) {
      const companyId = path.split('/')[2];
      const authHeader = event.headers?.authorization || event.headers?.Authorization || '';
      const token = authHeader.replace('Bearer ', '');

      const companyRes = await ddb.send(new GetCommand({ TableName: COMPANIES, Key: { companyId } }));
      if (!companyRes.Item || companyRes.Item.sessionToken !== token) {
        return json(401, { error: 'Unauthorized' });
      }

      const auditRes = await ddb.send(new QueryCommand({
        TableName: AUDIT,
        KeyConditionExpression: 'companyId = :c',
        ExpressionAttributeValues: { ':c': companyId },
        ScanIndexForward: false,
        Limit: 200
      }));

      return json(200, { events: auditRes.Items || [] });
    }

    // ── POST /auth/change-password ───────────────────────────────────────
    if (method === 'POST' && path === '/auth/change-password') {
      const company = await requireAuth();
      if (!company) return json(401, { error: 'Unauthorized' });

      const { companyId, newPassword } = body;
      if (!newPassword || newPassword.length < 6) return json(400, { error: 'Password must be at least 6 characters' });

      const pw = hashPassword(newPassword);

      await ddb.send(new UpdateCommand({
        TableName: COMPANIES,
        Key: { companyId },
        UpdateExpression: 'SET passwordHash = :h, passwordSalt = :s, updatedAt = :u',
        ExpressionAttributeValues: {
          ':h': pw.hash,
          ':s': pw.salt,
          ':u': new Date().toISOString(),
        }
      }));

      await audit(companyId, 'password_changed', 'Admin password changed', 'admin');

      return json(200, { message: 'Password updated' });
    }

    // ── PUT /company/{companyId} — update company settings ───────────────
    if (method === 'PUT' && path.match(/^\/company\/[^/]+$/)) {
      const companyId = path.split('/')[2];
      const company = await requireAuth();
      if (!company) return json(401, { error: 'Unauthorized' });

      const { companyName } = body;
      if (companyName) {
        await ddb.send(new UpdateCommand({
          TableName: COMPANIES,
          Key: { companyId },
          UpdateExpression: 'SET companyName = :n, updatedAt = :u',
          ExpressionAttributeValues: {
            ':n': companyName,
            ':u': new Date().toISOString(),
          }
        }));
      }

      await audit(companyId, 'settings_updated', 'Company settings updated', 'admin');

      return json(200, { message: 'Settings updated' });
    }

    return json(404, { error: 'Not found' });

  } catch (err) {
    console.error('Lambda error:', err);
    return json(500, { error: 'Internal server error' });
  }
};
