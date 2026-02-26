/**
 * CrabLogger
 *
 * A lightweight logger for CrabOptimize that prefixes messages and conditionally outputs based on the environment. In development/debug mode, it logs info and warnings.
 */

const PREFIX = '🦀 CrabOptimize:';

const isDebugEnv = (): boolean => {
	if ( process.env.NODE_ENV === 'development' ) {
		return true;
	}

	return false;
};

class CrabLogger {
	/**
	 * Log an informational message.
	 * Only outputs when in a debug/development environment.
	 *
	 * @param message The primary message string.
	 * @param args    Optional additional values to log.
	 */
	log( message: string, ...args: unknown[] ): void {
		if ( ! isDebugEnv() ) {
			return;
		}
		console.log( `${ PREFIX } ${ message }`, ...args );
	}

	/**
	 * Log a warning message.
	 * Only outputs when in a debug/development environment.
	 *
	 * @param message The primary message string.
	 * @param args    Optional additional values to log.
	 */
	warn( message: string, ...args: unknown[] ): void {
		if ( ! isDebugEnv() ) {
			return;
		}
		console.warn( `${ PREFIX } ${ message }`, ...args );
	}

	/**
	 * Log an error message.
	 * Errors are always logged regardless of environment so that real failures
	 * surface in production error tracking tools (e.g. Sentry).
	 *
	 * @param message The primary message string.
	 * @param args    Optional additional values to log.
	 */
	error( message: string, ...args: unknown[] ): void {
		console.error( `${ PREFIX } ${ message }`, ...args );
	}
}

export const logger = new CrabLogger();
