import test from 'node:test';
import assert from 'node:assert/strict';
import {mediaPhoto,photoSlug} from '../lib/media';
test('Private library filenames reject traversal and do not mistake trip uploads for library photos',()=>{
 assert.equal(mediaPhoto('../photo.jpg'),null);assert.equal(mediaPhoto('123e4567.jpg'),null);assert.equal(mediaPhoto('bbear-travels-ella--not-a-hash.jpg'),null);
 const photo=mediaPhoto('bbear-travels-ella-nine-arch-bridge--'+'a'.repeat(64)+'.jpg');assert.equal(photo?.title,'ella nine arch bridge');assert.ok(photo?.url.startsWith('/api/files/bbear-travels-'));
});
test('Photo names remove paths and extensions and preserve a single Bbear prefix',()=>{
 assert.equal(photoSlug('Bbear-Travels-Ella Nine Arch Bridge.JPG'),'ella-nine-arch-bridge');assert.equal(photoSlug('../../hello.png'),'hello');assert.equal(photoSlug('🌴.png'),'photo');
});
