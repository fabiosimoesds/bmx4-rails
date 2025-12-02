s3_options = {
  access_key_id:     Rails.application.credentials[Rails.env.to_sym][:aws_access_key_id],
  secret_access_key: Rails.application.credentials[Rails.env.to_sym][:aws_secret_access_key],
  region:            Rails.application.credentials[Rails.env.to_sym][:aws_region],
  bucket:            Rails.application.credentials[Rails.env.to_sym][:aws_bucket],
}

if Rails.env.test?
   require 'shrine/storage/memory'
   Shrine.storages = {
     cache: Shrine::Storage::Memory.new,
     store: Shrine::Storage::Memory.new,
   }
 else
   require 'shrine/storage/s3'
   Shrine.storages = {
     cache: Shrine::Storage::S3.new(prefix: "cache", **s3_options), # temporary
     store: Shrine::Storage::S3.new(prefix: "store", **s3_options), # permanent
   }
 end

Shrine.plugin :activerecord           # loads Active Record integration
Shrine.plugin :cached_attachment_data # enables retaining cached file across form redisplays
Shrine.plugin :remove_invalid         # automatically deletes and deassigns a new assigned file if it was invalid
Shrine.plugin :upload_endpoint        # Rack endpoint which accepts file uploads and forwards them to specified storage (recommended to use Uppy for asynchronous uploads)
Shrine.plugin :restore_cached_data    # extracts metadata for assigned cached files
Shrine.plugin :validation_helpers     # helper methods for validating attached files based on extracted metadata
Shrine.plugin :determine_mime_type    # determine and store the actual MIME type of the file analyzed from file content
Shrine.plugin :pretty_location        # attempts to generate a nicer folder structure for uploaded files
Shrine.plugin :presign_endpoint       # Rack endpoint which generates the URL, fields, and headers that can be used to upload files directly to a storage service
Shrine.plugin :derivatives, create_on_promote: true # automatically create derivatives on promotion

Shrine.plugin :presign_endpoint, presign_options: -> (request) do
  filename = request.params['filename']
  content_type = Rack::Mime.mime_type(File.extname(filename))
  {
    content_disposition: "attachment; filename=\"#{filename}\"", # download with original filename
    content_type:        content_type,                           # set correct content type
  }
end

Shrine.plugin :determine_mime_type, analyzer: -> (io, analyzers) do
  mime_type = analyzers[:file].call(io)
  mime_type = analyzers[:mime_types].call(io) if mime_type == "application/zip"
  mime_type
end
