import init, { hello } from '../../../wasm/pkg/craboptimize_wasm';

async function run() {
	await init();
	console.log( hello() );
}

run();
