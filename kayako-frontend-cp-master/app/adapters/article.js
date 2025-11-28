import ApplicationAdapter from './application';

function normalizeArticles(articles) {
  return articles.data.map(article => {
    // Extract the titles from the locale_field associated with titles
    const titles = article.titles.map(titleField => {
      const titleResource = articles.resources.locale_field[titleField.id];
      return {
        locale: titleResource.locale,
        translation: titleResource.translation
      };
    });

    // Extract the author name
    const creator = articles.resources.user_minimal[article.creator.id].full_name;

    // Extract the author
    const author = articles.resources.user_minimal[article.author.id];

    // Find the section for the article
    const section = articles.resources.section[article.section.id];
    const sectionTitles = section.titles.map(title => {
      const titleResource = articles.resources.locale_field[title.id];
      return {
        locale: titleResource.locale,
        translation: titleResource.translation
      };
    });

    // Find the category for the section
    const category = articles.resources.category[section.category.id];
    const categoryTitles = category.titles.map(title => {
      const titleResource = articles.resources.locale_field[title.id];
      return {
        locale: titleResource.locale,
        translation: titleResource.translation
      };
    });

    // Find the brand for the category
    const brand = articles.resources.brand[category.brand.id].name;

    // Format the lastModified date
    const lastModifiedDate = new Date(article.updated_at);
    const lastModified = lastModifiedDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).replace(/ /g, '/').replace('Sept', 'Sep');

    return {
      id: article.id,
      titles: titles,
      sections: sectionTitles,
      categories: categoryTitles,
      brand: brand,
      createdBy: creator,
      author: author,
      status: article.status,
      lastModified: lastModified
    };
  });
}

function normalizeArticle(articleResponse) {
  const article = articleResponse.data;
  const resources = articleResponse.resources;

  // Extract all titles associated with the article
  const titles = article.titles.map(titleField => {
    const titleResource = resources.locale_field[titleField.id];
    return {
      locale: titleResource.locale,
      translation: titleResource.translation
    };
  });

  // Extract all contents associated with the article
  const contents = article.contents.map(contentField => {
    const contentResource = resources.locale_field[contentField.id];
    return {
      locale: contentResource.locale,
      translation: contentResource.translation
    };
  });

  // Extract the creator name
  const creator = resources.user_minimal[article.creator.id].full_name;

  // Extract the author
  const author = resources.user_minimal[article.author.id];

  // Find the section for the article
  const section = resources.section[article.section.id];

  // Find the category for the section
  const category = resources.category[section.category.id];

  // Find the brand for the category
  const brand = resources.brand[category.brand.id].name;

  // Format the lastModified date
  const lastModifiedDate = new Date(article.updated_at);
  const lastModified = lastModifiedDate.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).replace(/ /g, '/');

  // Extract attachment data
  const attachments = article.attachments.map(attachment => {
    const attachmentData = resources.attachment[attachment.id];
    return {
      id: attachmentData.id,
      name: attachmentData.name,
      url: attachmentData.url,
      url_download: attachmentData.url_download,
      size: attachmentData.size
    };
  });

  // Extract tags
  const tags = article.tags.map(tag => {
    const tagData = resources.tag[tag.id];
    return {
      id: tagData.id,
      name: tagData.name
    };
  });

  return {
    id: article.id,
    titles: titles,
    contents: contents,
    brand: brand,
    createdBy: creator,
    lastModified: lastModified,
    attachments: attachments,
    tags: tags,
    status: article.status,
    author: author,
    searchKeywords: article.keywords,
    pinArticle: article.is_featured,
    allowComments: article.allow_comments,
    section: article.section.id
  };
}

export default ApplicationAdapter.extend({
  pathForType() {
    return 'article';
  },

  async fetchArticles({offset, limit, filters = []}) {
    const articles = await this.ajax('/api/v1/articles/list', 'POST', {
      data: {
        filters: filters,
        offset: offset,
        limit: limit
      }
    });
    return {
      'data': normalizeArticles(articles),
      'totalCount': articles.total_count
    };
  },

  async fetchArticleById(articleId) {
    const article = await this.ajax(`/api/v1/articles/${articleId}`, 'GET');
    return normalizeArticle(article);
  },

  async addArticle(articleData) {
    const response = await this.ajax('/api/v1/articles.json', 'POST', {
      data: articleData
    });

    return normalizeArticle(response);
  },

  async updateArticle(articleId, articleData) {
    const response = await this.ajax(`/api/v1/articles/${articleId}.json`, 'PUT', {
      data: articleData
    });

    return normalizeArticle(response);
  },

  async deleteByIds(articleIds) {
    await this.ajax(`/api/v1/articles?ids=${articleIds}`, 'DELETE', {data: {include: ''}});
  },

  async removeAttachment(articleId, attachmentId) {
    const response = await this.ajax(`/api/v1/articles/${articleId}/attachments/${attachmentId}.json`, 'DELETE');

    return response;
  },

  async fetchArticleCounts() {
    const response = await this.ajax('/api/v1/articles/count', 'GET');
    return {
      allCount: response.data.all_count,
      draftCount: response.data.draft_count,
      myPublishedCount: response.data.my_published_count
    };
  }
});
