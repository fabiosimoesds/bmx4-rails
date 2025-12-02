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

## Development

For running the app locally, you can use either of these commands;

- `foreman start`
- `bin/dev`
- or these commands in separate terminal windows;
- `rails server`
- `yarn build --watch` - watching JavaScript
- `yarn build:sass --watch` - watching Dart Sass
- `yarn build:postcss --watch` - watching PostCS

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

`export PERCY_TOKEN=`
`bundle exec npx percy exec -- rspec spec/features --tag only_percy`

## Browserstack Testing

When testing browser backward-compatibility through BrowserStack, you must precompile the CSS like production and disable auto compilation. To do this do not run the CSS build commands for dev but run `yarn build:css` once instead.

## Ngrok

Use ngrok to allow external APIs to access the app when in development. e.g. Postmark
Simply run `./ngrok http -bind-tls=true 3000` to create an accessible port.

## Mailers Generators

The folder that rails is going to look for the mailer view is custom and is app/views/mailers
The mailer generator `rails g mailer MailerName` will generate the view folder in the old path app/views, if using generator move the generated view folder to the new path app/views/mailers

## Sentry Auto-assign Setup

After sentry is setup for a new app, please follow the instructions on Notion [Sentry Auto-Assign Issues](https://www.notion.so/mmtmio/Sentry-Auto-Assign-Issues-d2a0ebe462c84c108129f9395e2898e3?pvs=4), to automatically assign the project support lead to issues.

## Toasts

Use the [Toasts Doc](./docs/toasts.md) as a guide for mmtm's toast copy style.

## CHANGELOG

Remember to document key updates after each sprint, dev days or major upgrade in the CHANGELOG to keep everyone up to speed.

## Devise Masquerade

When wanting to test the masquerade functionality locally, you will need to enable local caching through running `rails dev:cache`

- This will enable localhost memory caching, which is used by the `devise_masquerade` gem
- To turn this off, re-run the command
