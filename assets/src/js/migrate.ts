/**
 * Migration Manager for CrabOptimize
 * Uses the frontend WASM module to convert images, then uploads optimized versions
 */

import { processFile, isMimeTypeExcluded } from './editor';
import { __, sprintf } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';

class CrabMigration {
	private root: HTMLElement | null;
	private progressBar: HTMLElement | null = null;
	private statusText: HTMLElement | null = null;
	private currentPhase:
		| 'idle'
		| 'discovery'
		| 'conversion'
		| 'replacement'
		| 'complete' = 'idle';
	private discoveredImages: Array< {
		id: number;
		title: string;
		url: string;
		mime_type: string;
	} > = [];
	private convertedCount: number = 0;
	private failedCount: number = 0;
	private isPaused: boolean = false;
	private replacedPostsCount: number = 0;

	constructor() {
		this.root = document.getElementById( 'migration-root' );
		if ( this.root ) {
			this.renderBaseUI();
		}
	}

	private renderBaseUI() {
		if ( ! this.root ) {
			return;
		}

		this.root!.innerHTML = `
			<div class="crab-migration-box">
				<h2 id="phase-title">${ __(
					'CrabOptimize Migration Wizard',
					'dm-crab-optimize'
				) }</h2>
				<p>
					${ __(
						'This wizard will discover unoptimized images and convert them using the CrabOptimize WASM module.',
						'dm-crab-optimize'
					) }
				</p>

				<div id="migration-status-text">${ __(
					'Ready to start.',
					'dm-crab-optimize'
				) }</div>

				<div class="progress-container">
					<div id="crab-progress-bar" >0%</div>
				</div>

				<div id="migration-details">
					<div><strong>${ __(
						'Phase:',
						'dm-crab-optimize'
					) }</strong> <span id="detail-phase">${ __(
						'Not started',
						'dm-crab-optimize'
					) }</span></div>
					<div><strong>${ __(
						'Discovered:',
						'dm-crab-optimize'
					) }</strong> <span id="detail-discovered">0</span> ${ __(
						'images',
						'dm-crab-optimize'
					) }</div>
					<div><strong>${ __(
						'Converted:',
						'dm-crab-optimize'
					) }</strong> <span id="detail-converted">0</span> ${ __(
						'images',
						'dm-crab-optimize'
					) }</div>
					<div><strong>${ __(
						'Failed:',
						'dm-crab-optimize'
					) }</strong> <span id="detail-failed">0</span> ${ __(
						'images',
						'dm-crab-optimize'
					) }</div>
				</div>

				<div id="action-buttons">
					<button id="start-migration-btn" class="button button-primary">${ __(
						'Start Migration',
						'dm-crab-optimize'
					) }</button>
					<button id="pause-migration-btn" class="button" style="display: none;">${ __(
						'Pause',
						'dm-crab-optimize'
					) }</button>
					<button id="resume-migration-btn" class="button" style="display: none;">${ __(
						'Resume',
						'dm-crab-optimize'
					) }</button>
				</div>

				<details>
					<summary>
						${ __( 'Activity Log', 'dm-crab-optimize' ) }
					</summary>
					<div id="migration-logs">
						<!-- Logs will appear here -->
					</div>
				</details>
			</div>
		`;

		this.progressBar = document.getElementById( 'crab-progress-bar' );
		this.statusText = document.getElementById( 'migration-status-text' );

		document
			.getElementById( 'start-migration-btn' )
			?.addEventListener( 'click', ( e ) => {
				( e.target as HTMLButtonElement ).disabled = true;
				this.startMigration();
			} );

		document
			.getElementById( 'pause-migration-btn' )
			?.addEventListener( 'click', () => {
				this.pauseMigration();
			} );

		document
			.getElementById( 'resume-migration-btn' )
			?.addEventListener( 'click', () => {
				this.resumeMigration();
			} );
	}

	private updateUI( percent: number, message: string ) {
		if ( this.progressBar ) {
			this.progressBar.style.width = `${ Math.min( 100, percent ) }%`;
			this.progressBar.textContent = `${ Math.round( percent ) }%`;
		}
		if ( this.statusText ) {
			this.statusText.textContent = message;
		}
	}

	private addLog( message: string ) {
		const logsContainer = document.getElementById( 'migration-logs' );
		if ( logsContainer ) {
			const logEntry = document.createElement( 'div' );
			const timestamp = new Date().toLocaleTimeString();
			logEntry.textContent = `[${ timestamp }] ${ message }`;
			logEntry.style.color =
				message.includes( '❌' ) || message.includes( 'Error' )
					? '#d63638'
					: '#000';
			logEntry.style.padding = '4px 0';
			logsContainer.appendChild( logEntry );
			logsContainer.scrollTop = logsContainer.scrollHeight;
		}
	}

	private updateDetails() {
		const phaseEl = document.getElementById( 'detail-phase' );
		const discoveredEl = document.getElementById( 'detail-discovered' );
		const convertedEl = document.getElementById( 'detail-converted' );
		const failedEl = document.getElementById( 'detail-failed' );

		if ( phaseEl ) {
			phaseEl.textContent =
				this.currentPhase.charAt( 0 ).toUpperCase() +
				this.currentPhase.slice( 1 );
		}
		if ( discoveredEl ) {
			discoveredEl.textContent = this.discoveredImages.length.toString();
		}
		if ( convertedEl ) {
			convertedEl.textContent = this.convertedCount.toString();
		}
		if ( failedEl ) {
			failedEl.textContent = this.failedCount.toString();
		}
	}

	private async startMigration() {
		const settings = ( window as any ).dmCrabSettingsMigrate;
		this.currentPhase = 'discovery';
		this.discoveredImages = [];
		this.convertedCount = 0;
		this.failedCount = 0;
		this.isPaused = false;

		this.addLog(
			__( '🚀 Starting CrabOptimize Migration', 'dm-crab-optimize' )
		);
		this.addLog(
			__( 'Discovering unoptimized images.', 'dm-crab-optimize' )
		);
		this.updateDetails();

		await this.runDiscoveryPhase( settings );

		if ( this.isPaused ) {
			this.addLog( __( 'Migration paused by user', 'dm-crab-optimize' ) );
			return;
		}

		if ( this.discoveredImages.length > 0 ) {
			this.addLog(
				sprintf(
					// translators: %d is the number of unoptimized images found.
					__(
						'Discovery complete! Found %d unoptimized images.',
						'dm-crab-optimize'
					),
					this.discoveredImages.length
				)
			);
			this.addLog(
				__( 'Converting images using WASM.', 'dm-crab-optimize' )
			);
			this.currentPhase = 'conversion';
			this.updateDetails();

			await this.runConversionPhase( settings );
		} else {
			this.addLog(
				__(
					'No unoptimized images found. Migration complete!',
					'dm-crab-optimize'
				)
			);
			this.currentPhase = 'complete';
			this.updateUI(
				100,
				__(
					'Migration Complete! No unoptimized images found.',
					'dm-crab-optimize'
				)
			);
		}

		this.addLog(
			__( 'Starting Content Replacement Phase…', 'dm-crab-optimize' )
		);
		this.currentPhase = 'replacement'; // Add 'replacement' to your TS type definition
		this.updateDetails();

		await this.runReplacementPhase( settings );

		if ( ! this.isPaused ) {
			this.currentPhase = 'complete';
			this.updateUI(
				100,
				sprintf(
					// translators: %1$d = number of converted images, %2$d = number of failed images.
					__(
						'Migration Complete! Converted: %1$d, Failed: %2$d',
						'dm-crab-optimize'
					),
					this.convertedCount,
					this.failedCount
				)
			);
			this.addLog(
				sprintf(
					/* translators: %1$d = number of converted images, %2$d = number of failed images */
					__(
						'Migration finished. Converted: %1$d, Failed: %2$d',
						'dm-crab-optimize'
					),
					this.convertedCount,
					this.failedCount
				)
			);
			this.addLog(
				__(
					'Next: Use the Replacement Phase to update your pages and posts (coming soon)',
					'dm-crab-optimize'
				)
			);
		}

		this.updateDetails();
	}

	private pauseMigration() {
		this.isPaused = true;
		this.addLog( __( 'Migration paused', 'dm-crab-optimize' ) );
		const pauseBtn = document.getElementById(
			'pause-migration-btn'
		) as HTMLButtonElement;
		const resumeBtn = document.getElementById(
			'resume-migration-btn'
		) as HTMLButtonElement;
		if ( pauseBtn ) {
			pauseBtn.style.display = 'none';
		}
		if ( resumeBtn ) {
			resumeBtn.style.display = 'inline-block';
		}
	}

	private resumeMigration() {
		this.isPaused = false;
		this.addLog( __( 'Migration resumed', 'dm-crab-optimize' ) );
		const pauseBtn = document.getElementById(
			'pause-migration-btn'
		) as HTMLButtonElement;
		const resumeBtn = document.getElementById(
			'resume-migration-btn'
		) as HTMLButtonElement;
		if ( pauseBtn ) {
			pauseBtn.style.display = 'inline-block';
		}
		if ( resumeBtn ) {
			resumeBtn.style.display = 'none';
		}
		// Continue with conversion if we were in that phase
		if ( this.currentPhase === 'conversion' ) {
			this.startMigration();
		}
	}

	private async runDiscoveryPhase( settings: any ) {
		let currentPage = 1;
		let isFinished = false;
		let totalPages = 1;

		while ( ! isFinished && ! this.isPaused ) {
			this.updateUI(
				0,
				sprintf(
					// translators: %1$d = current page number, %2$d = total number of pages
					__(
						'Phase 1: Discovering images (Page %1$d/%2$d).',
						'dm-crab-optimize'
					),
					currentPage,
					totalPages
				)
			);

			try {
				const baseUrl = `${ settings.restUrl }/discover`;
				const separator = baseUrl.includes( '?' ) ? '&' : '?';
				const fetchUrl = `${ baseUrl }${ separator }page=${ currentPage }`;

				const response = await fetch( fetchUrl, {
					method: 'POST',
					headers: {
						'X-WP-Nonce': settings.nonce,
						'Content-Type': 'application/json',
					},
				} );

				if ( ! response.ok ) {
					throw new Error(
						`Discovery request failed with status ${ response.status }`
					);
				}

				const data = await response.json();
				totalPages = data.total_pages || 1;

				if ( data.images && Array.isArray( data.images ) ) {
					console.log(
						`Discovered ${ data.images.length } images on page ${ currentPage }`,
						data.images
					);
					const filteredImages = (
						data.images as Array< any >
					 ).filter(
						( img ) =>
							false === img.isOptimized &&
							! img.optimizedId &&
							! isMimeTypeExcluded( img.mime_type )
					);
					this.discoveredImages.push( ...filteredImages );
					this.addLog(
						sprintf(
							// translators: %1$d = number of unoptimized images found on the current page, %2$d = page number.
							__(
								'Found %1$d unoptimized images on page %2$d',
								'dm-crab-optimize'
							),
							filteredImages.length,
							currentPage
						)
					);
				}

				const progressPercent = ( currentPage / totalPages ) * 50;
				this.updateUI(
					progressPercent,
					sprintf(
						// translators: %1$d = current page number, %2$d = total pages.
						__(
							'Discovering: Page %1$d of %2$d',
							'dm-crab-optimize'
						),
						currentPage,
						totalPages
					)
				);
				this.updateDetails();

				if ( data.is_last || currentPage >= totalPages ) {
					isFinished = true;
				} else {
					currentPage++;
				}

				await new Promise( ( resolve ) => setTimeout( resolve, 100 ) );
			} catch ( error ) {
				console.error( 'Discovery error:', error );
				this.addLog(
					sprintf(
						/* translators: %s = error message */
						__( 'Error during discovery: %s', 'dm-crab-optimize' ),
						error instanceof Error ? error.message : 'Unknown error'
					)
				);
				this.updateUI(
					0,
					__(
						'Error during discovery. Check logs.',
						'dm-crab-optimize'
					)
				);
				return;
			}
		}

		this.addLog(
			sprintf(
				// translators: %d = total number of images to convert
				__(
					'Discovery phase complete. Total images to convert: %d',
					'dm-crab-optimize'
				),
				this.discoveredImages.length
			)
		);
	}

	private async runConversionPhase( settings: any ) {
		if ( this.discoveredImages.length === 0 ) {
			this.addLog( __( 'No images to convert.', 'dm-crab-optimize' ) );
			return;
		}

		const batchSize = 1; // Convert one at a time to better manage resources
		const totalBatches = Math.ceil(
			this.discoveredImages.length / batchSize
		);

		for (
			let batchIndex = 0;
			batchIndex < totalBatches && ! this.isPaused;
			batchIndex++
		) {
			const startIdx = batchIndex * batchSize;
			const endIdx = Math.min(
				startIdx + batchSize,
				this.discoveredImages.length
			);
			const batchImages = this.discoveredImages.slice( startIdx, endIdx );

			const progressPercent = 50 + ( batchIndex / totalBatches ) * 50;
			this.updateUI(
				progressPercent,
				sprintf(
					// translators: %1$d = current image number, %2$d = total images to convert
					__( 'Converting image %1$d of %2$d.', 'dm-crab-optimize' ),
					batchIndex + 1,
					this.discoveredImages.length
				)
			);

			for ( const imageData of batchImages ) {
				if ( this.isPaused ) {
					break;
				}

				this.addLog(
					sprintf(
						/* translators: %1$s = image title, %2$d = image ID */
						__(
							'Converting: %1$s (ID: %2$d).',
							'dm-crab-optimize'
						),
						imageData.title,
						imageData.id
					)
				);

				try {
					if ( isMimeTypeExcluded( imageData.mime_type ) ) {
						this.addLog(
							sprintf(
								/* translators: %s = image title */
								__(
									'Skipping %s (file type excluded from optimization).',
									'dm-crab-optimize'
								),
								imageData.title
							)
						);
						continue;
					}

					// Fetch the original image
					const imageResponse = await fetch( imageData.url );
					if ( ! imageResponse.ok ) {
						throw new Error(
							`Failed to fetch image: ${ imageResponse.status }`
						);
					}

					const imageBlob = await imageResponse.blob();
					const imageFile = new File(
						[ imageBlob ],
						imageData.url.split( '/' ).pop() || 'image.jpg',
						{
							type: imageData.mime_type,
						}
					);

					// Use the WASM module to convert the image
					const convertedFile = await processFile( imageFile );

					if ( ! convertedFile ) {
						throw new Error( 'WASM conversion returned null' );
					}

					// Upload the optimized file
					const optimizedId = await this.uploadOptimizedImage(
						imageData.id,
						convertedFile
					);

					if ( optimizedId ) {
						this.convertedCount++;
						this.addLog(
							sprintf(
								/* translators: %d is the optimized attachment ID */
								__(
									'Successfully converted and uploaded (Optimized ID: %d)',
									'dm-crab-optimize'
								),
								optimizedId
							)
						);
					} else {
						throw new Error( 'Failed to upload optimized image' );
					}
				} catch ( error ) {
					this.failedCount++;
					apiFetch( {
						path: `${ settings.restUrl }/set-failure`,
						method: 'POST',
						data: {
							attachment_id: imageData.id,
						},
					} ).catch( () => {} );

					console.error( 'Conversion error:', error );
					this.addLog(
						sprintf(
							/* translators: %s = error message */
							__( 'Failed to convert: %s', 'dm-crab-optimize' ),
							error instanceof Error
								? error.message
								: 'Unknown error'
						)
					);
				}

				this.updateDetails();

				// Small delay between conversions
				await new Promise( ( resolve ) => setTimeout( resolve, 500 ) );
			}
		}

		this.addLog(
			sprintf(
				/* translators: %1$d = number of converted images, %2$d = number of failed images */
				__(
					'Conversion phase complete. Converted: %1$d, Failed: %2$d',
					'dm-crab-optimize'
				),
				this.convertedCount,
				this.failedCount
			)
		);
	}

	private async uploadOptimizedImage(
		originalId: number,
		optimizedFile: File
	): Promise< number | null > {
		try {
			const formData = new FormData();

			formData.append( 'file', optimizedFile );

			formData.append( 'is_crab_optimized', 'true' );
			formData.append( 'is_crab_migration', 'true' );
			formData.append( 'original_id', originalId.toString() );

			const format =
				( window as any ).dmCrabSettingsMain?.format || 'avif';
			formData.append( 'crab_optimized_format', format );

			const response: any = await apiFetch( {
				path: '/wp/v2/media',
				method: 'POST',
				body: formData,
			} );

			if ( response && response.id ) {
				return response.id;
			}

			throw new Error( 'Upload succeeded but no ID returned' );
		} catch ( error ) {
			console.error( 'Upload error:', error );
			throw error;
		}
	}

	private async runReplacementPhase( settings: any ) {
		let currentPage = 1;
		let isFinished = false;
		let totalPages = 1;

		while ( ! isFinished && ! this.isPaused ) {
			const progressPercent = ( currentPage / totalPages ) * 100;
			this.updateUI(
				progressPercent,
				sprintf(
					/* translators: %1$d = current page number, %2$d = total number of pages */
					__(
						'Replacing images in content (Page %1$d/%2$d)',
						'dm-crab-optimize'
					),
					currentPage,
					totalPages
				)
			);

			try {
				const baseUrl = `${ settings.restUrl }/replace-content`;
				const separator = baseUrl.includes( '?' ) ? '&' : '?';
				const fetchUrl = `${ baseUrl }${ separator }page=${ currentPage }`;

				const response = await fetch( fetchUrl, {
					method: 'POST',
					headers: {
						'X-WP-Nonce': settings.nonce,
						'Content-Type': 'application/json',
					},
				} );

				if ( ! response.ok ) {
					throw new Error(
						`Replacement request failed: ${ response.status }`
					);
				}

				const data = await response.json();
				totalPages = data.total_pages || 1;

				// Track stats
				if ( data.replaced > 0 ) {
					this.replacedPostsCount += data.replaced;
					this.addLog(
						sprintf(
							// translators: %1$d = number of posts updated, %2$d = page number
							__(
								'Updated %1$d posts on page %2$d',
								'dm-crab-optimize'
							),
							data.replaced,
							currentPage
						)
					);
				}

				if ( data.is_last || currentPage >= totalPages ) {
					isFinished = true;
				} else {
					currentPage++;
				}
			} catch ( error ) {
				console.error( 'Replacement error:', error );
				this.addLog(
					sprintf(
						/* translators: %s = error message */
						__( 'Error replacing content: %s', 'dm-crab-optimize' ),
						error.message
					)
				);
				isFinished = true;
			}
		}
	}

	/**
	 * Get migration status from server
	 * @param settings
	 */
	private async getMigrationStatus( settings: any ) {
		try {
			const response = await fetch(
				`${ settings.restUrl }/get-migration-status`,
				{
					method: 'GET',
					headers: {
						'X-WP-Nonce': settings.nonce,
						'Content-Type': 'application/json',
					},
				}
			);

			if ( ! response.ok ) {
				throw new Error(
					`Status request failed with status ${ response.status }`
				);
			}

			return await response.json();
		} catch ( error ) {
			console.error( 'Failed to get migration status:', error );
			return null;
		}
	}
}

document.addEventListener( 'DOMContentLoaded', () => {
	new CrabMigration();
} );
