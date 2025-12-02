# Use this setup block to configure all options available in SimpleForm.
SimpleForm.setup do |config|
  config.button_class = 'button'

  config.wrappers :string, tag: 'div', class: 'form__input', error_class: 'field--errors' do |b|
    b.use :html5
    b.use :placeholder
    b.optional :maxlength
    b.optional :minlength
    b.optional :pattern
    b.optional :min_max
    b.optional :readonly

    b.use :label, class: 'string'
    b.wrapper :icon_wrapper, tag: 'div', class: 'input-field' do |ba|
      ba.use :input, class: 'string'
    end
    b.use :error, wrap_with: { tag: 'span', class: 'form__hint form__hint--error' }
    b.use :hint,  wrap_with: { tag: 'span', class: 'form__hint' }
  end

  config.wrappers :select, tag: 'div', class: 'form__input select', error_class: 'field--errors' do |b|
    b.use :html5
    b.optional :readonly

    b.use :label, class: 'select'
    b.wrapper :icon_wrapper, tag: 'div', class: 'input-field input-field--select' do |ba|
      ba.use :input, class: 'select'
    end
    b.use :error, wrap_with: { tag: 'span', class: 'form__hint form__hint--error' }
    b.use :hint,  wrap_with: { tag: 'span', class: 'form__hint' }
  end

  config.wrappers :multi_select2, tag: 'div', class: 'form__input select', error_class: 'field--errors' do |b|
    b.use :html5
    b.optional :readonly

    b.use :label, class: 'select'
    b.wrapper :icon_wrapper, tag: 'div', class: 'input-field input-field--select input-field--select2' do |ba|
      ba.use :input, class: 'select select2--multi', data: {  select2_target: 'multi' }
    end
    b.use :error, wrap_with: { tag: 'span', class: 'form__hint form__hint--error' }
    b.use :hint,  wrap_with: { tag: 'span', class: 'form__hint' }
  end

  config.wrappers :single_select2, tag: 'div', class: 'form__input select', error_class: 'field--errors' do |b|
    b.use :html5
    b.optional :readonly

    b.use :label, class: 'select'
    b.wrapper :icon_wrapper, tag: 'div', class: 'input-field input-field--select input-field--select2' do |ba|
      ba.use :input, class: 'select select2--single', data: {  select2_target: 'single' }
    end
    b.use :error, wrap_with: { tag: 'span', class: 'form__hint form__hint--error' }
    b.use :hint,  wrap_with: { tag: 'span', class: 'form__hint' }
  end

  config.wrappers :boolean, tag: 'div', class: 'form__input control', error_class: 'field--errors' do |b|
    b.use :html5
    b.optional :readonly

    b.use :input
    b.use :label

    b.use :error, wrap_with: { tag: 'span', class: 'form__hint form__hint--error' }
    b.use :hint,  wrap_with: { tag: 'span', class: 'form__hint' }
  end

  config.wrappers :toggle, tag: 'div', error_class: 'field_with_errors' do |b|
    b.use :html5
    b.use :label_input, wrap_with: { class: 'control control--toggle' }
    b.use :error, wrap_with: { tag: 'span', class: 'form__hint form__hint--error' }
    b.use :hint,  wrap_with: { tag: 'span', class: 'form__hint' }
  end

  config.default_wrapper = :string
  config.wrapper_mappings = {
    boolean: :boolean,
    toggle: :toggle,
    select: :select,
    enum: :select,
  }
end
