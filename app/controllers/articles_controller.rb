class ArticlesController < ApplicationController
  layout 'application'
  before_action :authenticate_account!, only: [:edit, :update, :new, :create]

  def index
    @pagy, @articles = pagy(policy_scope(Article).includes(:author).order(created_at: :desc))
  end

  def show
    @article = Article.find_by!(slug: params[:id])
    authorize @article
  end

  def new
    @article = Article.new(posted_at: Time.current)
    form_setup
  end

  def create
    @article = Article.new(article_params)

    if @article.save
      flash[:success] = 'Article was successfully created'

      redirect_to article_path(@article.slug)
    else
      form_setup
      render :new, status: :unprocessable_entity
    end
  end

  def edit
    @article = Article.find_by!(slug: params[:id])
    form_setup
  end

  def update
    @article = Article.find(params[:id])

    if @article.update(article_params)
      flash[:success] = 'Article was successfully updated'

      redirect_to article_path(@article.slug)
    else
      form_setup

      render :edit, status: :unprocessable_entity
    end
  end

  private

  def article_params
    params.expect(
      article: [
        :title,
        :summary,
        :content,
        :posted_at,
        :published,
        :thumbnail_image_url,
        :author_id,
        :tags,
      ]
    )
  end

  def form_setup
    @authors = Author.order(:name).load_async
  end
end
