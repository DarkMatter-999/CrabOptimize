/**
 * Types used by the legacy Plupload uploader.
 */

/**
 * Represents a file in the Plupload queue.
 */
export interface PluploadFile {
	/** Unique identifier for the file. */
	id: string;
	/** Original filename. */
	name: string;
	/** MIME type of the file. */
	type: string;
	/** Returns the native `File` instance. */
	getNative: () => File;
	/** Flag indicating the file has already been processed to AVIF. */
	_crabOptimized?: boolean;
}

/**
 * Represents the Plupload instance used in the classic editor.
 */
export interface PluploadInstance {
	/** Files currently queued for upload. */
	files: PluploadFile[];
	/** Binds an event handler to the uploader. */
	bind: (
		event: string,
		cb: ( up: PluploadInstance, files: PluploadFile[] ) => void
	) => void;
	/** Stops automatic upload start. */
	stop: () => void;
	/** Starts the upload process. */
	start: () => void;
	/** Removes a file from the queue. */
	removeFile: ( file: PluploadFile | string ) => void;
	/** Adds a file to the queue. */
	addFile: ( file: File, name?: string ) => void;
	/** Refreshes the UI after queue changes. */
	refresh: () => void;
	/** Upload settings, including multipart parameters. */
	settings: {
		multipart_params?: Record< string, string >;
	};
}

/**
 * Global window extension for WordPress uploader integration.
 */
declare global {
	interface Window {
		wp?: {
			Uploader?: {
				prototype: { init: () => void };
			};
		};
	}
}
