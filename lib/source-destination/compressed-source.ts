import { basename, extname } from 'path';
import { Transform } from 'stream';
import StreamLimiter = require('stream-limiter');

import { Metadata } from './metadata';
import { SourceSource } from './source-source';
import { NotCapable } from '../errors';

export abstract class CompressedSource extends SourceSource {
	protected abstract createTransform(): Transform;

	protected async getSize(): Promise<number | undefined> {
		return;
	}

	async canCreateReadStream(): Promise<boolean> {
		return true;
	}

	async _createReadStream(end?: number): Promise<NodeJS.ReadableStream> {
		const stream = await this.source.createReadStream();
		const transform = this.createTransform();
		stream.pipe(transform);
		if (end !== undefined) {
			const limiter = new StreamLimiter(end + 1);
			transform.pipe(limiter);
			return limiter;
		}
		return transform;
	}

	async _getMetadata(): Promise<Metadata> {
		const sourceMetadata = await this.source.getMetadata();
		const compressedSize = sourceMetadata.compressedSize || sourceMetadata.size;
		const size = await this.getSize();
		let name;
		if (sourceMetadata.name !== undefined) {
			name = basename(sourceMetadata.name, extname(sourceMetadata.name));
		}
		return { name, size, compressedSize };
	}
}