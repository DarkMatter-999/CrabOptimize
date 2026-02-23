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
 * Global window extensions for WordPress uploader integration and media attachment view.
 */
declare global {
	interface Window {
		wp?: {
			Uploader?: {
				prototype: { init: () => void };
			};
			media?: {
				view?: {
					Attachment?: {
						prototype: AttachmentView;
					};
				};
			};
		};
	}
}

/*
*  Minimal interfaces for global WP objects.
*/

/**
 * Minimal representation of attachment metadata used by the uploader.
 */
interface AttachmentMeta {
	is_crab_optimized?: string;
	[key: string]: any;
}

/**
 * Model for a WordPress media attachment, exposing a `get` method.
 */
interface AttachmentModel {
	get( attribute: 'meta' ): AttachmentMeta;
	get( attribute: string ): any;
}

/**
 * View representation of a WordPress media attachment.
 */
interface AttachmentView {
	el: HTMLElement;
	model: AttachmentModel;
	render(): AttachmentView;
}

declare global {
 interface Window {
  dmCrabSettingsMain?: {
   saveUnoptimized?: boolean;
   generateThumbnails?: boolean;
   format?: string;
   quality?: number;
   qualityWebp?: number;
   speed?: number;
   imageSizes?: Record<string, any>;
   excludedTypes?: string;
  };
 }
}
