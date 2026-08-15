import { Injectable, NotFoundException } from '@nestjs/common';
import { PublicTablesService } from '../public-tables/public-tables.service';
import crypto from 'node:crypto';

export interface TableCall {
  id: string;
  restaurantId: string;
  branchId: string;
  tableId: string;
  tableName: string;
  type: 'WAITER' | 'WATER' | 'BILL';
  status: 'PENDING' | 'RESOLVED';
  createdAt: Date;
}

@Injectable()
export class TableCallsService {
  private calls: TableCall[] = [];

  constructor(private readonly publicTablesService: PublicTablesService) {}

  async createCall(token: string, type: 'WAITER' | 'WATER' | 'BILL') {
    const resolved = await this.publicTablesService.resolveTableToken(token);
    
    const newCall: TableCall = {
      id: crypto.randomUUID(),
      restaurantId: resolved.restaurant.id,
      branchId: resolved.branch.id,
      tableId: resolved.table.id,
      tableName: resolved.table.name,
      type,
      status: 'PENDING',
      createdAt: new Date(),
    };

    // Remove duplicates of same type for the table to avoid flooding the waiter dashboard
    this.calls = this.calls.filter(
      (c) => !(c.tableId === newCall.tableId && c.type === type && c.status === 'PENDING')
    );

    this.calls.push(newCall);
    return newCall;
  }

  getPendingCalls(branchId: string): TableCall[] {
    return this.calls.filter((c) => c.branchId === branchId && c.status === 'PENDING');
  }

  resolveCall(id: string) {
    const call = this.calls.find((c) => c.id === id);
    if (!call) throw new NotFoundException('Call request not found');
    call.status = 'RESOLVED';
    
    // Cleanup resolved calls from memory array
    this.calls = this.calls.filter((c) => c.status === 'PENDING');
    return call;
  }
}
