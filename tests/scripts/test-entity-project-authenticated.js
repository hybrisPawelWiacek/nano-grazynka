#!/usr/bin/env node

const http = require('http');
const crypto = require('crypto');

// Test configuration
const API_URL = 'http://localhost:3101';
const timestamp = Date.now();
const testEmail = `test-entity-${timestamp}@test.com`;
const testPassword = 'TestPass123!';

let authToken = null;
let userId = null;
let projectId = null;
let entityIds = [];

async function makeRequest(method, path, data = null, headers = {}) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3101,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    headers: res.headers,
                    body: body ? JSON.parse(body) : null
                });
            });
        });

        req.on('error', reject);
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

async function runTests() {
    console.log('=========================================');
    console.log('Entity Project System Test Suite');
    console.log('=========================================');
    console.log(`Test User: ${testEmail}\n`);

    let testsPassed = 0;
    let testsFailed = 0;

    // Test 1: Register User
    console.log('Test 1: Register User');
    try {
        const response = await makeRequest('POST', '/api/auth/register', {
            email: testEmail,
            password: testPassword,
            name: 'Test User'
        });
        
        if (response.status === 200 || response.status === 201) {
            authToken = response.body.token || response.headers['set-cookie']?.find(c => c.startsWith('token='))?.split('=')[1]?.split(';')[0];
            userId = response.body.user?.id;
            console.log('✅ User registered successfully');
            testsPassed++;
        } else {
            throw new Error(`Status ${response.status}: ${JSON.stringify(response.body)}`);
        }
    } catch (error) {
        console.log('❌ User registration failed:', error.message);
        testsFailed++;
        return; // Can't continue without auth
    }

    // Test 2: Login to get token
    console.log('\nTest 2: Login');
    try {
        const response = await makeRequest('POST', '/api/auth/login', {
            email: testEmail,
            password: testPassword
        });
        
        if (response.status === 200) {
            // Extract token from cookie or response body
            const cookieHeader = response.headers['set-cookie'];
            if (cookieHeader) {
                const tokenCookie = cookieHeader.find(c => c.startsWith('token='));
                if (tokenCookie) {
                    authToken = tokenCookie.split('=')[1].split(';')[0];
                }
            }
            if (!authToken && response.body.token) {
                authToken = response.body.token;
            }
            console.log('✅ Login successful');
            testsPassed++;
        } else {
            throw new Error(`Status ${response.status}`);
        }
    } catch (error) {
        console.log('❌ Login failed:', error.message);
        testsFailed++;
    }

    // Test 3: Create Project
    console.log('\nTest 3: Create Project');
    try {
        const response = await makeRequest('POST', '/api/projects', {
            name: `Test Project ${timestamp}`,
            description: 'Test project for entity system validation'
        }, {
            'Cookie': `token=${authToken}`
        });
        
        if (response.status === 201) {
            projectId = response.body.project.id;
            console.log('✅ Project created:', projectId);
            testsPassed++;
        } else {
            throw new Error(`Status ${response.status}: ${JSON.stringify(response.body)}`);
        }
    } catch (error) {
        console.log('❌ Project creation failed:', error.message);
        testsFailed++;
    }

    // Test 4: Create Entities
    console.log('\nTest 4: Create Entities');
    const entities = [
        { name: 'Microsoft', type: 'company', value: 'Microsoft', description: 'Tech company' },
        { name: 'Żabka', type: 'company', value: 'Żabka', description: 'Polish convenience store' },
        { name: 'Claude API', type: 'technical', value: 'Claude API', description: 'AI API' },
        { name: 'Dario Amodei', type: 'person', value: 'Dario Amodei', description: 'CEO of Anthropic' }
    ];

    for (const entity of entities) {
        try {
            const response = await makeRequest('POST', '/api/entities', entity, {
                'Cookie': `token=${authToken}`
            });
            
            if (response.status === 201) {
                entityIds.push(response.body.entity.id);
                console.log(`✅ Entity created: ${entity.name}`);
                testsPassed++;
            } else {
                throw new Error(`Status ${response.status}`);
            }
        } catch (error) {
            console.log(`❌ Entity creation failed (${entity.name}):`, error.message);
            testsFailed++;
        }
    }

    // Test 5: Associate Entities with Project
    console.log('\nTest 5: Associate Entities with Project');
    if (projectId && entityIds.length > 0) {
        try {
            const response = await makeRequest('POST', `/api/projects/${projectId}/entities`, {
                entityIds: entityIds
            }, {
                'Cookie': `token=${authToken}`
            });
            
            if (response.status === 200) {
                console.log(`✅ Associated ${entityIds.length} entities with project`);
                testsPassed++;
            } else {
                throw new Error(`Status ${response.status}`);
            }
        } catch (error) {
            console.log('❌ Entity association failed:', error.message);
            testsFailed++;
        }
    }

    // Test 6: List Entities
    console.log('\nTest 6: List Entities');
    try {
        const response = await makeRequest('GET', '/api/entities', null, {
            'Cookie': `token=${authToken}`
        });
        
        if (response.status === 200) {
            console.log(`✅ Listed ${response.body.entities.length} entities`);
            testsPassed++;
        } else {
            throw new Error(`Status ${response.status}`);
        }
    } catch (error) {
        console.log('❌ List entities failed:', error.message);
        testsFailed++;
    }

    // Test 7: List Projects
    console.log('\nTest 7: List Projects');
    try {
        const response = await makeRequest('GET', '/api/projects', null, {
            'Cookie': `token=${authToken}`
        });
        
        if (response.status === 200) {
            console.log(`✅ Listed ${response.body.projects.length} projects`);
            testsPassed++;
        } else {
            throw new Error(`Status ${response.status}`);
        }
    } catch (error) {
        console.log('❌ List projects failed:', error.message);
        testsFailed++;
    }

    // Test 8: Get Project with Entities
    console.log('\nTest 8: Get Project with Entities');
    if (projectId) {
        try {
            const response = await makeRequest('GET', `/api/projects/${projectId}`, null, {
                'Cookie': `token=${authToken}`
            });
            
            if (response.status === 200) {
                const entityCount = response.body.project.entities?.length || 0;
                console.log(`✅ Project has ${entityCount} associated entities`);
                testsPassed++;
            } else {
                throw new Error(`Status ${response.status}`);
            }
        } catch (error) {
            console.log('❌ Get project failed:', error.message);
            testsFailed++;
        }
    }

    // Test 9: Upload with Project Context
    console.log('\nTest 9: Upload with Project Context');
    if (projectId) {
        const FormData = require('form-data');
        const fs = require('fs');
        
        try {
            const form = new FormData();
            form.append('file', fs.createReadStream('tests/test-data/zabka.m4a'), {
                filename: 'zabka.m4a',
                contentType: 'audio/m4a'
            });
            form.append('projectId', projectId);
            form.append('language', 'PL');
            
            const formHeaders = form.getHeaders();
            formHeaders['Cookie'] = `token=${authToken}`;
            
            const uploadResponse = await new Promise((resolve, reject) => {
                const req = http.request({
                    hostname: 'localhost',
                    port: 3101,
                    path: '/api/voice-notes',
                    method: 'POST',
                    headers: formHeaders
                }, (res) => {
                    let body = '';
                    res.on('data', chunk => body += chunk);
                    res.on('end', () => {
                        resolve({
                            status: res.statusCode,
                            body: body ? JSON.parse(body) : null
                        });
                    });
                });
                
                req.on('error', reject);
                form.pipe(req);
            });
            
            if (uploadResponse.status === 201) {
                console.log('✅ Upload with project context successful');
                console.log('   Voice note ID:', uploadResponse.body.voiceNote.id);
                testsPassed++;
            } else {
                throw new Error(`Status ${uploadResponse.status}`);
            }
        } catch (error) {
            console.log('❌ Upload with project context failed:', error.message);
            testsFailed++;
        }
    }

    // Summary
    console.log('\n=========================================');
    console.log('Test Summary');
    console.log('=========================================');
    console.log(`Total Tests: ${testsPassed + testsFailed}`);
    console.log(`Passed: ${testsPassed}`);
    console.log(`Failed: ${testsFailed}`);
    console.log(`Pass Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);
    
    if (testsFailed > 0) {
        process.exit(1);
    }
}

// Run tests
runTests().catch(console.error);