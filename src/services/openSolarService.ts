/**
 * OpenSolar Integration Service
 * Mock implementation for fetching OpenSolar project data
 */

import type { OpenSolarProject } from '@/types';
import { generateId } from '@/lib/utils';

/**
 * Mock OpenSolar API client
 */
class OpenSolarService {
  /**
   * Fetch projects from OpenSolar API
   * In production, this would make actual API calls
   */
  async fetchProjects(tokenId?: string): Promise<OpenSolarProject[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock data
    const projects: OpenSolarProject[] = [
      {
        id: generateId(),
        name: 'Residential Solar - 123 Main St',
        status: 'active',
        owner: 'John Doe',
        createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        lastModified: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        location: {
          address: '123 Main Street, San Francisco, CA 94102',
          coordinates: {
            lat: 37.7749,
            lng: -122.4194,
          },
        },
        systemSize: 8.5,
        estimatedCost: 25000,
        metadata: {
          panels: 24,
          inverterType: 'String',
          batteryStorage: false,
        },
      },
      {
        id: generateId(),
        name: 'Commercial Solar - Tech Park',
        status: 'pending',
        owner: 'Acme Corp',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        lastModified: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        location: {
          address: '456 Tech Parkway, Palo Alto, CA 94301',
          coordinates: {
            lat: 37.4419,
            lng: -122.1430,
          },
        },
        systemSize: 45.2,
        estimatedCost: 120000,
        metadata: {
          panels: 120,
          inverterType: 'Micro',
          batteryStorage: true,
          batteryCapacity: 30,
        },
      },
      {
        id: generateId(),
        name: 'Solar Farm - Green Valley',
        status: 'completed',
        owner: 'Green Energy Inc',
        createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        lastModified: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        location: {
          address: 'Green Valley Road, Sacramento, CA 95814',
          coordinates: {
            lat: 38.5816,
            lng: -121.4944,
          },
        },
        systemSize: 250.0,
        estimatedCost: 850000,
        metadata: {
          panels: 750,
          inverterType: 'Central',
          batteryStorage: true,
          batteryCapacity: 500,
        },
      },
    ];

    return projects;
  }

  /**
   * Fetch single project by ID
   */
  async fetchProject(projectId: string): Promise<OpenSolarProject | null> {
    if (!projectId) {
      console.warn('fetchProject called with empty projectId');
      return null;
    }
    
    try {
      const projects = await this.fetchProjects();
      return projects.find(p => p.id === projectId) || null;
    } catch (error) {
      console.error('Error fetching project:', error);
      return null;
    }
  }

  /**
   * Fetch project status
   */
  async fetchProjectStatus(projectId: string): Promise<{
    status: string;
    progress: number;
    lastUpdate: Date;
    nextMilestone?: string;
  }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    return {
      status: 'In Progress',
      progress: 65,
      lastUpdate: new Date(),
      nextMilestone: 'Permit Approval',
    };
  }

  /**
   * Validate API token
   */
  async validateToken(token: string): Promise<boolean> {
    if (!token || token.trim() === '') {
      return false;
    }
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Mock validation (in production, this would validate against OpenSolar API)
    return token.startsWith('sk_');
  }
}

// Singleton instance
export const openSolarService = new OpenSolarService();
