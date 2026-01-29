/**
 * Provides a simple asynchronous task queue that respects a maximum
 * concurrency limit derived from the host's hardware capabilities.
 * The concurrency is capped at six simultaneous tasks to avoid
 * overwhelming typical environments.
 */

/** Maximum number of concurrent tasks (hardware threads, minimum 2, max 6). */
const MAX_CONCURRENCY = Math.min( navigator.hardwareConcurrency || 2, 6 );

/**
 * A queue that executes asynchronous tasks with a bounded level of
 * concurrency.
 *
 * Tasks added via add() are stored until there is capacity to run
 * them. The queue automatically starts pending tasks as running tasks
 * complete.
 */
export class CrabQueue {
	/** Current count of tasks that are actively running. */
	private running = 0;

	/** Queue of pending tasks awaiting execution. */
	private queue: {
		/** Function that returns a promise representing the task work. */
		task: () => Promise< any >;
		/** Resolve function from the promise returned by add(). */
		resolve: any;
		/** Reject function from the promise returned by add(). */
		reject: any;
	}[] = [];

	/**
	 * Enqueue a new asynchronous task.
	 *
	 * @param task A function that returns a promise. The promise's resolution
	 *             or rejection will be forwarded to the caller of add().
	 * @return A promise that resolves with the task's result or rejects with
	 *          the task's error.
	 */
	async add< T >( task: () => Promise< T > ): Promise< T > {
		return new Promise( ( resolve, reject ) => {
			this.queue.push( { task, resolve, reject } );
			this.process();
		} );
	}

	/**
	 * Internal helper that starts queued tasks while respecting the
	 * concurrency limit.
	 *
	 * This method is called whenever a new task is added or a running task
	 * completes. It ensures that up to MAX_CONCURRENCY tasks are
	 * executing concurrently.
	 */
	private async process() {
		if ( this.running >= MAX_CONCURRENCY || this.queue.length === 0 ) {
			return;
		}

		this.running++;
		const { task, resolve, reject } = this.queue.shift()!;

		try {
			const result = await task();
			resolve( result );
		} catch ( err ) {
			reject( err );
		} finally {
			this.running--;
			this.process();
		}

		if ( this.running < MAX_CONCURRENCY && this.queue.length > 0 ) {
			this.process();
		}
	}
}
