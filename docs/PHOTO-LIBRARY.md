# Photo library

Open **Photos** to search or add reusable pictures. Use **Your photos** in the cover/day photo chooser to select them. Website catalogue photos remain available under **Website photos**. Upload for this trip continues to attach a picture only to the current proposal.

Multi-file uploads process three pictures at a time. Keep the page open. Progress reports added pictures, duplicates and failures. Re-select failed files to retry; successful ones are retained. Re-uploading the same image under another name is skipped after image normalization. Visually similar photos, different crops or recompressed variants can still need manual review; this is not an automatic visual duplicate detector.

Files remain private in the existing `bbear-private` Supabase bucket, through the same staff authorization and storage policies as proposal files. Local mode stores them in `data/files`. No new tables, public buckets or privileged keys are required. The library reads its titles from filenames; the private storage filenames include a content hash, while the delivered photo collection uses readable SEO names.

Photos are normalized to JPEG, oriented correctly, and limited to 2400 pixels on the longest side without enlargement. Location names supplied during uploads are not independently verified by the app. Use a descriptive subject name if the place is uncertain. Keep originals and supplier image permissions separately.

Back up the bucket as well as the proposal database. The Settings records download does not contain photo binaries. Existing proposals and website tour records are not overwritten by library imports.

Initial collection on 31 October 2026: 387 files from the four user-specified folders, visually reviewed using contact sheets and exact/pixel/perceptual/crop comparisons. 19 duplicate copies omitted, 360 photos prepared for import, 8 questionable/non-destination images separated into a Review folder. Separate views of the same place are retained. Source-to-output mappings are in the delivered Photo-register.csv. This is a practical review, not an independent geolocation or copyright certification.
