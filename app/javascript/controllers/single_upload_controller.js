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
  static targets = [
    'previewContainer',
    'preview',
    'inputContainer',
    'uppyInput',
    'formInput', // actual form field that gets submitted
    'progressContainer',
    'progressBar',
    'fileName',
    'errorContainer',
    'errorInformer',
    'successHint',
  ]

  static values = {
    inputName: String,
    presignEndpoint: String,
    permittedFileTypes: Array,
    buttonHint: { type: String, default: 'Upload a File' },
    buttonIcon: { type: String, default: '' },
    maxFileSize: { type: Number, default: 50000000 },
    uploading: { type: Boolean, default: false },
  }

  connect() {
    let form = this.element.closest('form')
    let presignEndpoint = this.presignEndpointValue
    let upload_count = 0 // for checking for concurrent uploads

    this.uppyInputTarget.innerHTML = ''

    this.uppy = new Uppy({
      autoProceed: true,
      infoTimeout: 604800, // length of time to show the informer error for (1 week)
      restrictions: {
        maxFileSize: this.maxFileSizeValue,
        allowedFileTypes: this.permittedFileTypesValue.length == 0 ? null : this.permittedFileTypesValue,
        maxNumberOfFiles: 1,
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
            dropHereOr: 'Upload a file by clicking, or drag & drop',
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
              Sentry.captureMessage('Single-Upload JS Controller Failed to Complete AWS Request', { extra: { err: err, params: file } })
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
        thumbnailType: 'image/jpeg',
        waitForThumbnailsBeforeUpload: false,
      })
      .on('thumbnail:generated', (file, preview) => {
        this.previewTarget.style.backgroundImage = `url("${preview}")`
      })
      .on('file-added', (file) => {
        // set current form uploader as uploading
        this.uploadingValue = true

        // disable the form submit buttons while file uploading
        form.querySelectorAll('input[type="submit"], button[type="submit"]').forEach((submit) => {
          submit.disabled = true
        })

        // reset preview and set file name
        this.previewTarget.style.backgroundImage = null
        this.fileNameTargets[0].innerText = file.name
        this.fileNameTargets[1].innerText = file.name
      })
      .on('upload', (data) => {
        this.progressContainerTarget.classList.remove('display--none')
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

        if (!['image/jpeg', 'image/png', 'image/gif'].includes(file.type)) {
          this.previewTarget.innerHTML = this.file_icon(file.type)
        }

        // set hidden field value to the uploaded file data so that it's submitted with the form as the attachment
        this.formInputTarget.value = uploadedFileData

        // show preview
        this.previewContainerTarget.classList.remove('display--none')
        this.inputContainerTarget.classList.add('display--none')

        // set current form uploader as not uploading
        this.uploadingValue = false

        // re-enable submit buttons if there are no other form uploads uploading
        if (form.querySelectorAll('div[data-controller="single-upload"][data-upload-uploading-value="true"]').length === 0) {
          form.querySelectorAll('input[type="submit"], button[type="submit"]').forEach((submit) => {
            submit.disabled = false
          })
        }

        // hide error hint and show the success upload hint
        this.errorContainerTarget.classList.add('display--none')
        this.successHintTarget.classList.remove('display--none')

        // remove field error class removing the red colours
        this.element.classList.remove('field--errors')
      })
      .on('upload-error', (file, error, response) => {
        // set current form uploader as not uploading
        this.uploadingValue = false

        // re-enable submit buttons if there are no other form uploads uploading
        if (form.querySelectorAll('div[data-controller="single-upload"][data-upload-uploading-value="true"]').length === 0) {
          form.querySelectorAll('input[type="submit"], button[type="submit"]').forEach((submit) => {
            submit.disabled = false
          })
        }

        this.errorContainerTarget.classList.remove('display--none')
        Sentry.captureMessage('Upload JS Controller Upload Error', { extra: { file: file, error: error, response: response } })

        // remove the file from the store now so it can be easily found from the id, and to allow re-uploading immediately
        this.uppy.removeFile(file.id)
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

  file_icon(file_type) {
    let preview = '<div class="h--100pc display--flex justify-content--center align-items--center">'

    switch (file_type) {
      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        preview += '<i class="fa-regular fa-2x fa-file-word"></i>'
        break
      case 'application/vnd.ms-excel':
      case 'application/xls':
      case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
        preview += '<i class="fa-regular fa-2x fa-file-excel"></i>'
        break
      case 'application/pdf':
        preview += '<i class="fa-regular fa-2x fa-file-pdf"></i>'
        break
      case 'application/vnd.ms-powerpoint':
      case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
        preview += '<i class="fa-regular fa-2x fa-file-powerpoint"></i>'
        break
      case 'text/csv':
        preview += '<i class="fa-regular fa-2x fa-file-csv"></i>'
        break
      case 'application/octet-stream': // any 'unknown' style documents
        preview += '<i class="fa-regular fa-2x fa-cube"></i>'
        break
      default:
        preview += '<i class="fa-regular fa-2x fa-file"></i>'
        break
    }

    return (preview += '</div>')
  }

  disconnect() {
    this.uppy.close()
  }

  // when user clicks Replace, show the input field
  replaceFile() {
    this.previewContainerTarget.classList.add('display--none')
    this.inputContainerTarget.classList.remove('display--none')
    this.progressContainerTarget.classList.add('display--none')
    this.formInputTarget.value = null
    this.previewTarget.innerHTML = null

    // Uppy version 1 does require this as was causing issues when replacing files back to back
    if (this.uppy.getFiles().length > 0) {
      this.uppy.removeFile(this.uppy.getFiles()[0].id)
    }
  }

  // show a tooltip on the submit actions when a file is uploading
  disabledSubmitTooltip(form) {
    let action_containers = form.querySelectorAll('.form__actions, .form__actions--section, .modal__bottom')

    action_containers.forEach((action_container) => {
      this.tippy = tippy(action_container, {
        allowHTML: true,
        content: 'Waiting for files to upload before you can submit the form',
        placement: 'top-end',
        animation: 'fade',
        arrow: false,
        delay: [200, 50],
        onShow: (instance) => {
          return !!action_container.querySelector('input[type="submit"]').disabled
        },
      })
    })
  }
}
