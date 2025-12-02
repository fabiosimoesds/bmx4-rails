# athena-rails

## When Starting a New App

Copy the contents of the project to a new project folder, however do not copy;

- .git
- config/master.key
- config/credentials.yml.enc

Change the name Athena to the new app name (this is not the entire list);

- .github/workflows/test_runner.yml
- app/javascript/sentry.js
- app/views/layouts/mailer.html.erb
- config/application.rb
- config/cable.yml
- config/database.yml
- config/environments/production.rb
- config/environments/staging.rb
- config/initializers/devise.rb
- config/jumpstart.yml
- package.json

Check if the app will be using Heroku Key-Value Store or RedisCloud per Environment and make changes accordingly in;

- config/cable.yml

Run yarn build and yarn build:sass to change any naming in compiled files

Setup a new, private EMPTY repo with 'app-rails', then follow the instruction from 'git init' onwards. Run 'git add .' instead though

### AWS S3 Credentials set up

In Notion, go to: Engineering Wiki (Workspace) -> Guides (List) -> Open Encrypted Credentials Rails (Document)

You will need to comment out a line within config/application.rb to allow for the creation of the new credentials and master key
Follow the instructions in the document to fill out the [master.key](./config/master.key) and the [credentials.yml.enc](./config/credentials.yml.enc).

See the [credentials.yml.example](./config/credentials.yml.example) for a credentials template.

### Sentry

Someone with admin permissions will need to create a new project in Sentry.io. The sentry_js_dsn key can then be copied and put in the credentials

### GTag

Someone with admin permissions will need to create a new project in Google Analytics. The tag id can then be added in the analytics partial on line 2 and 8

### Postmark

Someone with admin permissions will need to create a new server in Postmark. The Server API can then be copied and put in the credentials postmark_api_key

## Seeding

```
rails db:create
rails db:migrate
rails db:seed
```

## Font Awesome kit

In FontAwesome setup a new [kit](https://fontawesome.com/kits) for the project.
Add new kit and give it the name of the new app. The default selected styles are: 
- Classic - Solid, Regular, Light
- Duotone - Solid
- Brands

Add more styles when you see fit. \
Make sure you add the domains onto the kit so that it is not open. \
Make sure the embed Code is set to CSS Only in settings.

## Emojis 

Emojis can be used throughout the application by adding the appropriate CSS class to any element. The base emoji styles are defined in `app/assets/stylesheets/emoji.scss`.

- Syntax: `<span class="emoji emoji-lock-and-key"></span>`

To add new emoji icons use [emojipedia](https://emojipedia.org/) to find the Apple emoji under "Emoji Designs". Save the image and copy it into a base64 encoder like [jpillora](http://jpillora.com/base64-encoder/). Then copy this onto the emoji.scss file using the correct background image definition.

## Development

For running the app locally, you can these commands in separate terminal windows;

- `bundle exec rails server`
- `yarn build --watch` - watching JavaScript
- `yarn build:sass --watch` - watching Dart Sass
- `yarn build:postcss --watch` - watching PostCS
- `bundle exec sidekiq` - for running sidekiq

## Models & Speccing

It is helpful to keep a common order for code within models and specs. There may be some deviation in models due to before_destroy actions but it will primarily follow:

- Associations
- Enums
- Nested Attrs
- Monetize
- Validations (with custom ones below)
- Callbacks
- AASM
- Methods

Any packages go at the top of the model but are not required in specs

## ESBuild JavaScript

When setting up a new JavaScript file, you will have to add the file name to the `esbuild.config.js`, `entryPoints` for it to get compiled

## Linters

Linting helps ensure consistent code style and and can catch possible issues early.

The following linters are used:

- **Rubocop** is a Ruby linter. Configuration is in `.rubocop.yml` and `.rubocop_airbnb.yml` and it lints all Ruby files.
- **Prettier** is a JavaScript linter. Configuration is in `prettier.config.js`. It lints all JS files inside `app/javascript`.
- **ERB Lint** is a tool to help lint your ERB or HTML files using some default linters.

Using **Lefthook**, these linters are run automatically on commit but they can also be run manually.

<details>
<summary>How to install Lefthook and run linters automatically</summary>

Run `lefthook install` to synchronise `.git/hooks/pre-commit` with lefthook configuration. This must be the first thing you do after cloning the repo. This ensures that lefthook is run on every
commit automatically.

</details>

<details>
<summary>How to run linters manually</summary>

- To run all checks manually, run `lefthook run pre-commit`.
- To run specific checks, run `lefthook run pre-commit --commands <command>`. Commands are defined in `.lefthook.yml` (aka. rubocop, prettier, and erblint).
  - Your lefthook should be version 1.5 above for this to work, check `lefthook version` and `gem updated lefthook`, if it needs updating.

</details>

<details>
<summary>How to ignore the linters</summary>

- If you really need to commit without caring about linting issues (😮), you can use the `--no-verify` flag at the end of your commit, which will let the commit go through without linting.
- Alternatively, to stop lefthook from running on a commit, append `LEFTHOOK=0` to the command or set it as an ENV. You can also remove lefthook and prevent it from running by
  calling `lefthook uninstall`.

</details>

## Percy

For visual testing, we use [Percy](https://percy.io/) through Browserstack (login in 1Password).
We can run Percy specs locally, test they work, and view them straight away, before letting Percy do the snapshots with all its variations to help save us time and on our snapshot allowance

First: Run Percy on Master
  - Checkout to Master Branch run the following two commands:
    `export PERCY_TOKEN=add_percy_token`
    `bundle exec npx percy exec -- rspec spec/features --tag only_percy`

Second: The master branch should be auto-approved, but check on the link generated by percy, if master is not approve click the button to approve it.

Third: Run Percy Locally on the Branch
  - Checkout to the Branch you want to compare.
  - Replace all the `page.percy_snapshot` with `save_and_open_screenshot # page.percy_snapshot`
  - Run the following command:
    `bundle exec -- rspec spec/features --tag only_percy`
  - Check all Screenshots and fix any failing specs
  - Replace all the `save_and_open_screenshot # page.percy_snapshot` with `page.percy_snapshot` 

Fourth: Run Percy
  - Run the complete Percy command
    `bundle exec npx percy exec -- rspec spec/features --tag only_percy`

Check the our [Percy Use](https://www.notion.so/mmtmio/Percy-Use-abd7393a57af457c88e66342ce3cc6bd?pvs=4) notion doc for more information.

## Browserstack Testing

When testing browser backward-compatibility through BrowserStack, you must precompile the CSS like production and disable auto compilation. To do this do not run the CSS build commands for dev but run `yarn build:css` once instead.

## Ngrok

Use ngrok to allow external APIs to access the app when in development. e.g. Postmark

Log into our Shared ngrok account, to get the [TOKEN]
Run the CLI command `ngrok config add-authtoken [TOKEN]`
run `ngrok http 3000 --domain mmtm.ngrok.io` to create a tunnel to your 3000 port.
The app should be accessible via https://mmtm.ngrok.io/

## Mailers Generators

The folder that rails is going to look for the mailer view is custom and is app/views/mailers
The mailer generator `rails g mailer MailerName` will generate the view folder in the old path app/views, if using generator move the generated view folder to the new path app/views/mailers

## Toasts

Use the [Toasts Doc](./docs/toasts.md) as a guide for mmtm's toast copy style.

## CHANGELOG

Remember to document key updates after each sprint, dev days or major upgrade in the CHANGELOG to keep everyone up to speed.

## Devise Masquerade

When wanting to test the masquerade functionality locally, you will need to enable local caching through running `rails dev:cache`

- This will enable localhost memory caching, which is used by the `devise_masquerade` gem
- To turn this off, re-run the command
