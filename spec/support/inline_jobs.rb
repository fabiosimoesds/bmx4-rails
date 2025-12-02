RSpec.configure do |config|
  # Inline job will cause all job calls to be ran inline (essentially turning FakeJob.perform_later
  # into FakeJob.new.perform) when called, they do not hit the queue

  config.around(:each) do |example|
    ActiveJob::Base.queue_adapter.enqueued_jobs.clear
    example.run
  end

  config.around(:each, inline_jobs: true) do |example|
    original_queue_adapter = ActiveJob::Base.queue_adapter
    ActiveJob::Base.queue_adapter = :inline
    example.run
    ActiveJob::Base.queue_adapter = original_queue_adapter
  end
end
