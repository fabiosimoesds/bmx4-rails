import { Controller } from '@hotwired/stimulus'
import Uppy from '@uppy/core'
import DragDrop from '@uppy/drag-drop'
import Informer from '@uppy/informer'
import AwsS3 from '@uppy/aws-s3'
import Compressor from '@uppy/compressor'
import ThumbnailGenerator from '@uppy/thumbnail-generator'
import * as Sentry from '@sentry/browser'

/** Example usage:
 * app/views/templates/base/partials/inputs/_multi_uploader.html.erb
 * Use on Table-style uploaders
 * Use on Cocoon-style Autosaving uploaders
 **/

export default class extends Controller {
  static targets = ['cocoonAddFields', 'uppyInput', 'progressContainer', 'progressBar']

  static values = {
    inputName: String,
    presignEndpoint: String,
    permittedFileTypes: Array,
    buttonHint: { type: String, default: 'Upload a File' },
    buttonIcon: { type: String, default: '' },
    maxFilesCount: { type: Number, default: 0 },
    maxFileSize: { type: Number, default: 50000000 },
    autosave: { type: Boolean, default: false },
    uploading: { type: Boolean, default: false },
  }

  connect() {
    let form = this.element.closest('form')
    let presignEndpoint = this.presignEndpointValue
    let cocoon_count = 0
    let upload_count = 0 // for checking for concurrent uploads

    this.uppyInputTarget.innerHTML = ''

    this.uppy = new Uppy({
      autoProceed: true,
      infoTimeout: 604800, // length of time to show the informer error for (1 week)
      restrictions: {
        maxFileSize: this.maxFileSizeValue,
        allowedFileTypes: this.permittedFileTypesValue.length == 0 ? null : this.permittedFileTypesValue,
        maxNumberOfFiles: this.maxFilesCountValue,
      },
    })
      .use(DragDrop, {
        inputName: this.inputNameValue,
        target: this.uppyInputTarget,
        note: this.buttonHintValue,
        onDragOver: (event) => {
          this.uppyInputTarget.classList.add('uppy-input--onDragOver')
        },
        onDragLeave: (event) => {
          this.uppyInputTarget.classList.remove('uppy-input--onDragOver')
        },
        onDrop: (event) => {
          this.uppyInputTarget.classList.remove('uppy-input--onDragOver')
        },
        locale: {
          strings: {
            dropHereOr: 'Multi-upload files by clicking, or drag & drop',
          },
        },
      })
      .use(Informer, {
        target: '.uppy-Informer-errors',
      })
      .use(AwsS3, {
        companionUrl: '/',
        limit: 5, // default: 5
        timeout: 45 * 1000, // default: 30000
        getUploadParameters(file) {
          return fetch(`${presignEndpoint}?filename=${file.name}&type=${file.type}`, {
            method: 'get',
            headers: {
              accept: 'application/json',
              'content-type': 'application/json',
            },
          })
            .then((response) => {
              return response.json()
            })
            .then((data) => {
              return {
                method: data.method,
                url: data.url,
                fields: data.fields,
              }
            })
            .catch((err) => {
              Sentry.captureMessage('Multi-Upload JS Controller Failed to Complete AWS Request', { extra: { err: err, params: file } })
            })
        },
      })
      .use(Compressor, {
        quality: 0.6, // default: 0.6
        limit: 10, // default: 10
      })
      .use(ThumbnailGenerator, {
        thumbnailWidth: 300,
        thumbnailHeight: 300,
      })
      .on('file-added', (file) => {
        // these are only triggered after the cocoonAddFieldsTarget is clicked
        $(document).on('cocoon:before-insert', (event, added_fields) => {
          // remove the event listener after it's been triggered
          $(document).off('cocoon:before-insert')

          file.currentTarget = added_fields[0]
          file.currentTarget.querySelector('.nested-field__name').innerText = file.name

          if (file.currentTarget.classList.contains('cocoon-watch')) {
            // incremenet cocoon count each time a cocoon field is inserted so we have a unique id
            cocoon_count++

            // set container id and cocoon_id field for turbo streams replace action
            let cocoonIdField = file.currentTarget.querySelector('#cocoon_id')
            if (cocoonIdField != null) {
              file.currentTarget.id = file.currentTarget.id + '_' + cocoon_count
              cocoonIdField.value = file.currentTarget.id
            }
          }
        })

        // remove the event listener after it's been triggered
        $(document).on('cocoon:after-insert', (event, added_fields) => {
          $(document).off('cocoon:after-insert')
        })

        // trigger the cocoon insert click event
        this.cocoonAddFieldsTarget.click()
      })
      .on('upload-progress', (file, progress) => {
        let current_progress = Math.round((progress.bytesUploaded / progress.bytesTotal) * 100)
        let progress_text = file.currentTarget.querySelector('.progress-text')

        if (progress_text != null) {
          progress_text.innerText = current_progress.toString() + '%'
        }
      })
      .on('upload', (data) => {
        this.progressContainerTarget.classList.remove('display--none')
        upload_count++
        // add uploading value attribute of 'true' on the uploader
        this.uploadingValue = true

        // disable the form submit buttons while file uploading (if it is an ordinary form)
        if (this.autosaveValue != true) {
          form.querySelectorAll('input[type="submit"], button[type="submit"]').forEach((submit) => {
            submit.disabled = true
          })
        }
      })
      .on('progress', (progress) => {
        this.progressBarTarget.style.width = progress.toString() + '%'
      })
      .on('upload-success', (file) => {
        // construct uploaded file data in the format that Shrine expects
        let uploadedFileData = JSON.stringify({
          id: file.meta['key'].match(/^cache\/(.+)/)[1], // object key without prefix
          storage: 'cache',
          metadata: {
            size: file.size,
            filename: file.name,
            mime_type: file.type,
          },
        })

        let file_input = file.currentTarget.querySelector('input[data-name="file"]')

        // set the uploaded file data on the file input
        if (file_input) file_input.value = uploadedFileData

        // hide progress after successful upload
        let progressTracker = file.currentTarget.querySelector('.existing-file__progress')
        if (progressTracker) progressTracker.classList.add('display--none')

        // autosave
        if (this.autosaveValue == true) file.currentTarget.querySelector('.nested-field__autosave').click()
      })
      .on('thumbnail:generated', (file, preview) => {
        let blobField = file.currentTarget.querySelector('.blob')

        if (blobField) {
          file.currentTarget.querySelector('.existing-file__preview').style.backgroundImage = `url("${preview}")`
          blobField.value = preview
        }
      })
      .on('complete', () => {
        this.progressContainerTarget.classList.add('display--none')
        upload_count--
        // set uploading value attribute to 'false' on the uploader
        this.uploadingValue = false

        // re-enable submit buttons if there are no other uploaders uploading
        if (form && form.querySelectorAll('div[data-controller="upload"][data-upload-uploading-value="true"]').length === 0 && upload_count == 0) {
          form.querySelectorAll('input[type="submit"], button[type="submit"]').forEach((submit) => {
            submit.disabled = false
          })
        }
      })
      .on('error', (error) => {
        Sentry.captureMessage('Multi-Upload JS Controller Error', { extra: { error: error } })
      })
      .on('upload-error', (file, error, response) => {
        Sentry.captureMessage('Multi-Upload JS Controller Upload Error', { extra: { file: file, error: error, response: response } })
      })

    if (this.buttonIconValue.length > 0) {
      this.uppyInputTarget.querySelector('.uppy-DragDrop-label').insertAdjacentHTML('beforebegin', `${this.buttonIconValue}`)
    }

    // remove cocoon removed files from uppy store so user can reupload the same file
    $(document).on('cocoon:before-remove', (event, removed_field) => {
      // if cocoon element is removed for current uppy instance
      if (this.element.contains(removed_field[0])) {
        let removed_filename = removed_field[0].querySelector('.nested-field__name').innerText

        // remove the correct file by comparing the file names
        Object.values(this.uppy.store.state.files).forEach((file) => {
          if (file.name == removed_filename) {
            this.uppy.removeFile(file.id)
          }
        })
      }
    })
  }

  disconnect() {
    this.uppy.close()
  }
}
