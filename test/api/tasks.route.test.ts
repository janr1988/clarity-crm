import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, POST } from '@/app/api/tasks/route';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(() =>
    Promise.resolve({
      user: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        role: 'SALES_AGENT',
      },
    })
  ),
}));

describe('Tasks API', () => {
  beforeEach(async () => {
    // Clean up test data
    await prisma.task.deleteMany({
      where: { title: { startsWith: 'Test Task' } }
    });
    await prisma.user.deleteMany({
      where: { email: 'test@example.com' }
    });
    
    // Create test user
    await prisma.user.create({
      data: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed-password',
        role: 'SALES_AGENT',
      },
    });
  });

  describe('POST /api/tasks', () => {
    it('creates a task with valid data', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test Description',
        status: 'TODO',
        priority: 'HIGH',
      };

      const request = new NextRequest('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.title).toBe(taskData.title);
      expect(data.status).toBe(taskData.status);
      expect(data.priority).toBe(taskData.priority);
      expect(data.id).toBeDefined();
    });

    it('rejects task without title', async () => {
      const taskData = {
        status: 'TODO',
        priority: 'HIGH',
      };

      const request = new NextRequest('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toBeDefined();
      expect(data.details.some((d: any) => d.field === 'title')).toBe(true);
    });

    it('rejects task with invalid status', async () => {
      const taskData = {
        title: 'Test Task',
        status: 'INVALID_STATUS',
        priority: 'HIGH',
      };

      const request = new NextRequest('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('accepts task with due date', async () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7); // 7 days from now

      const taskData = {
        title: 'Test Task with Due Date',
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate: dueDate.toISOString(),
      };

      const request = new NextRequest('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.title).toBe(taskData.title);
      expect(data.dueDate).toBeDefined();
    });

    it('rejects task with invalid due date format', async () => {
      const taskData = {
        title: 'Task with Invalid Date',
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate: '28.10.2025, 15:47', // Invalid format
      };

      const request = new NextRequest('http://localhost:3000/api/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });
  });

  describe('GET /api/tasks', () => {
    beforeEach(async () => {
      // Clean up test data
      await prisma.task.deleteMany({
        where: {
          title: {
            startsWith: 'Test',
          },
        },
      });
    });

    it('returns list of tasks', async () => {
      // Create a test task first
      const user = await prisma.user.findFirst({
        where: { role: 'SALES_LEAD' },
      });

      if (user) {
        await prisma.task.create({
          data: {
            title: 'Test Task for GET',
            status: 'TODO',
            priority: 'HIGH',
            createdById: user.id,
          },
        });
      }

      const request = new NextRequest('http://localhost:3000/api/tasks');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
    });

    it('filters tasks by status', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/tasks?status=TODO'
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      
      // All tasks should have TODO status
      if (data.length > 0) {
        expect(data.every((task: any) => task.status === 'TODO')).toBe(true);
      }
    });

    it('filters tasks by assigneeId', async () => {
      const user = await prisma.user.findFirst();
      if (!user) {
        return; // Skip test if no users
      }

      const request = new NextRequest(
        `http://localhost:3000/api/tasks?assigneeId=${user.id}`
      );
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      
      // All tasks should be assigned to the specified user
      if (data.length > 0) {
        expect(
          data.every((task: any) => task.assigneeId === user.id)
        ).toBe(true);
      }
    });
  });
});

