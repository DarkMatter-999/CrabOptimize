import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CrabQueue } from '../crab-queue.ts';

describe( 'CrabQueue', () => {
	let queue: CrabQueue;

	beforeEach( () => {
		queue = new CrabQueue();
	} );

	it( 'should execute a single task and return the result', async () => {
		const task = vi.fn().mockResolvedValue( 'success' );
		const result = await queue.add( task );

		expect( task ).toHaveBeenCalledTimes( 1 );
		expect( result ).toBe( 'success' );
	} );

	it( 'should handle rejected tasks', async () => {
		const task = vi.fn().mockRejectedValue( new Error( 'failed' ) );

		await expect( queue.add( task ) ).rejects.toThrow( 'failed' );
	} );

	it( 'should respect the maximum concurrency limit', async () => {
		const maxTasks = Math.min( navigator.hardwareConcurrency || 2, 6 );

		let activeCount = 0;
		let maxObservedConcurrency = 0;

		const createTask = () => async () => {
			activeCount++;
			maxObservedConcurrency = Math.max(
				maxObservedConcurrency,
				activeCount
			);
			// Simulate some work
			await new Promise( ( resolve ) => setTimeout( resolve, 10 ) );
			activeCount--;
		};

		// Add more tasks than the limit
		const tasks = Array.from( { length: 10 }, () =>
			queue.add( createTask() )
		);

		await Promise.all( tasks );

		expect( maxObservedConcurrency ).toBeLessThanOrEqual( maxTasks );
	} );

	it( 'should process tasks in the order they were added (FIFO)', async () => {
		const executionOrder: number[] = [];

		const createTask = ( id: number ) => async () => {
			executionOrder.push( id );
		};

		// We add several tasks. Even with concurrency,
		// they should be shifted off the queue in order.
		await Promise.all( [
			queue.add( createTask( 1 ) ),
			queue.add( createTask( 2 ) ),
			queue.add( createTask( 3 ) ),
		] );

		expect( executionOrder ).toEqual( [ 1, 2, 3 ] );
	} );

	it( 'should continue processing the queue after a task fails', async () => {
		const task1 = vi.fn().mockRejectedValue( new Error( 'oops' ) );
		const task2 = vi.fn().mockResolvedValue( 'still works' );

		// Catch the first error so it doesn't kill the test
		await queue.add( task1 ).catch( () => {} );
		const result2 = await queue.add( task2 );

		expect( result2 ).toBe( 'still works' );
		expect( task2 ).toHaveBeenCalled();
	} );
} );
