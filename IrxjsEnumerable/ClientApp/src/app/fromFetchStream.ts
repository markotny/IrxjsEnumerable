import { Observable } from 'rxjs';

/**
 * Stream server data (e.g. from endpoint returning IAsyncEnumerable)
 * @type T type of stream element
 * @param input input param of {@link fetch}
 * @param init init param of {@link fetch} (excluding abort signal)
 * @return stream of array elements one by one
 */
export function fromFetchStream<T>(input: RequestInfo, init?: RequestInit): Observable<T> {
  return new Observable<T>(observer => {
    const controller = new AbortController();

    fetch(input, { ...init, signal: controller.signal })
      .then(async response => {
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Failed to read response');
        }
        const decoder = new JsonStreamDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!value) continue;

          decoder.decodeChunk<T>(value, item => observer.next(item));
        }
        observer.complete();
        reader.releaseLock();
      })
      .catch(err => observer.error(err));

    return () => controller.abort();
  });
}

/** Simple stream decoder, supports partial objects */
class JsonStreamDecoder {
  /** item starts and ends at level 0, all nested objects are part of main item */
  private level = 0;

  /** when last item is cut off and completed in beginning of next chunk */
  private partialItem = '';

  private decoder = new TextDecoder();

  /** Decodes stream chunk. If root object is array, {@link decodedItemCallback} will be called for each array item. */
  public decodeChunk<T>(value: Uint8Array, decodedItemCallback: (item: T) => void): void {
    const chunk = this.decoder.decode(value);
    let itemStart = 0;

    for (let i = 0; i < chunk.length; i++) {
      if (chunk[i] === JTOKEN_START_OBJECT) {
        if (this.level === 0) {
          itemStart = i;
        }
        this.level++;
      }
      if (chunk[i] === JTOKEN_END_OBJECT) {
        this.level--;
        if (this.level === 0) {
          let item = chunk.substring(itemStart, i + 1);
          if (this.partialItem) {
            item = this.partialItem + item;
            this.partialItem = '';
          }
          decodedItemCallback(JSON.parse(item));
        }
      }
    }
    // last object didn't have closing token - it will come in next chunk
    if (this.level !== 0) {
      this.partialItem = chunk.substring(itemStart);
    }
  }
}
const JTOKEN_START_OBJECT = '{';
const JTOKEN_END_OBJECT = '}';
