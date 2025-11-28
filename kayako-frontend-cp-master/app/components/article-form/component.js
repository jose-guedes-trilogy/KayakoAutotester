import config from 'frontend-cp/config/environment';
import Component from '@ember/component';
import { inject as service } from '@ember/service';
import { get, computed } from '@ember/object';
import { observer } from '@ember/object';
import { task, timeout } from 'ember-concurrency';
import { Promise } from 'rsvp';
import isInternalTag from '../../utils/is-internal-tag';

export default Component.extend({
  article: null,
  categoriesTree: [],
  statuses: ['DRAFT', 'PUBLISHED'],
  headingTitle: 'New Article',
  onCancel: () => {},
  onSave: () => {},

  articleEvents: service(),
  sessionService: service('session'),
  store: service(),
  router: service(),
  tagsService: service('tags'),
  notification: service(),
  locale: service(),
  i18n: service(),
  
  isSaving: false,
  originalArticle: null,
  selectedLocale: null,
  sectionSearchEnabled: true,

  articleTitleChange: observer('currentTitle', function() {
    if (this.get('article.errors.titles')) {
      this.set('article.errors.titles', null);
    }
  }),

  currentTitle: computed('article.titles.@each.translation', 'selectedLocale', function() {
    let selectedLocale = this.get('selectedLocale');
    const articleTitles = this.get('article.titles');
    const index = articleTitles.findIndex(t => t.locale === selectedLocale);
    if (index > -1) {
      return articleTitles[index].translation;
    }
    return '';
  }),

  currentLocaleContent: computed('article.contents.@each.translation', 'selectedLocale', function() {
    let selectedLocale = this.get('selectedLocale');
    const articleContents = this.get('article.contents');
    const index = articleContents.findIndex(c => c.locale === selectedLocale);
    if (index > -1) {
      return articleContents[index].translation;
    }
    return '';
  }),

  contentChangeObserver: observer('currentLocaleContent', function() {
    if (this.get('article.errors.contents')) {
      this.set('article.errors.contents', null);
    }
  }),

  didInsertElement() {
    this._super(...arguments);
    document.querySelector('form').addEventListener('keydown', function(event) {
      if (event.key === 'Enter' && (!event.target || event.target.type !== 'textarea')) {
        event.preventDefault();
      }
    });
  },

  onCancelAttachment: () => {},
  attachedFiles: null,

  init() {
    this._super(...arguments);
    this.get('fetchCategories').perform();
    const article = this.get('article');
    const defaultLocale = this.get('locale.accountDefaultLocaleCode');
    this.set('selectedLocale', defaultLocale);
    this.set('originalArticle', JSON.parse(JSON.stringify(article)));
    this.set('isSaving', false);
    if (!article.id) {
      const currentUser = this.get('sessionService.user');
      this.set('article.author', {
        id: currentUser.get('id'),
        fullName: currentUser.get('fullName')
      });
    }
  },

  willDestroy() {
    this._super(...arguments);
    this.resetArticle();
  },

  resetArticle() {
    const originalArticle = this.get('originalArticle');
    this.set('article', JSON.parse(JSON.stringify(originalArticle)));
  },

  froalaParams: computed('plugins', function() {
    const lineHeight = 20;
    const padding = 24;
    return {
      heightMin: (18 * lineHeight) + padding,
      requestHeaders: { 'X-CSRF-Token': this.get('sessionService.csrfToken') },
      key: config.froalaEditor.key,
      imageUploadURL: '/api/v1/media?include=*',
      imageUploadParam: 'files',
      imageDefaultDisplay: 'inline',
      imageEditButtons: ['imageReplace', 'imageAlign', 'imageRemove', '|', 'imageLink', 'linkOpen', 'linkEdit', 'linkRemove', '-', 'imageDisplay', 'imageAlt', 'imageSize'],
      imageDefaultWidth: 0,
      tableEditButtons: ['tableHeader', 'tableRemove', '|', 'tableRows', 'tableColumns', 'tableStyle', '-', 'tableCells', 'tableCellBackground', 'tableCellVerticalAlign', 'tableCellHorizontalAlign'],
      tableStyles: {
        'fr-alternate-rows': 'Alternate Rows'
      },
      toolbarButtons: ['paragraphFormat', '|', 'fontSize', 'bold', 'italic', 'underline', 'strikeThrough', 'subscript', 'superscript', 'color', 'emoticons', '|', 'align', '|', 'formatOL', 'formatUL', 'outdent', 'indent', 'quote', '|', 'insertLink', 'insertImage', 'insertTable', 'insertHR', '|', 'undo', 'redo', 'clearFormatting', 'html', 'fullscreen'],
      toolbarButtonsMD: ['paragraphFormat', '|', 'fontSize', 'bold', 'italic', 'underline', 'strikeThrough', 'subscript', 'superscript', 'color', 'emoticons', '|', 'align', '|', 'formatOL', 'formatUL', 'outdent', 'indent', 'quote', '|', 'insertLink', 'insertImage', 'insertTable', 'insertHR', '|', 'undo', 'redo', 'clearFormatting', 'html', 'fullscreen'],
      toolbarSticky: true,
      toolbarStickyOffset: 0,
      htmlRemoveTags: ['style'],
      linkInsertButtons: [],
      linkEditButtons: ['linkOpen', 'linkEdit', 'linkRemove'],
      pluginsEnabled: this.get('plugins'),
      zIndex: 60,
      classNames: ['froala-editor-container-full']
    };
  }),

  plugins: [
    'align',
    'link',
    'lists',
    'paragraphFormat',
    'quote',
    'url',
    'image',
    'fontSize',
    'charCounter',
    'codeBeautifier',
    'codeView',
    'colors',
    'emoticons',
    'fontFamily',
    'fullscreen',
    'table'
  ],

  // Pre-selects first section of first category in the dropdown
  preSelectSection() {
    const firstSectionId = this.get('categoriesTree.firstObject.children.firstObject.id');
    this.set('article.section', firstSectionId);
  },

  fetchCategories: task(function * () {
    let store = this.get('store');
    let sections = yield store.query('section', {});
    let tree = [];

    sections.forEach(section => {
      let category = section.get('category');
      let sectionNode = {
        id: section.get('id'),
        value: section.get('title')
      };
      let categoryNode = tree.findBy('value', category.get('title'));

      if (!categoryNode) {
        categoryNode = {
          value: category.get('title'),
          children: []
        };

        tree.push(categoryNode);
      }

      categoryNode.children.push(sectionNode);
    });
    
    // Set the tree with all loaded sections
    this.set('categoriesTree', tree);
    
    // If no section is set for the article, pre-select the first one
    if (!this.get('article.section')) {
      this.preSelectSection();
    } else {
      // If this is an existing article, check if it has a section
      this.loadArticleSection();
    }
  }),

  search: task(function * (term) {
    yield timeout(300);
    
    if (!term || term.trim() === '') {
      return [];
    }
    
    // Call the sections API with the search term
    const store = this.get('store');
    const sections = yield store.query('section', { search: term });
    
    // Create a flattened list of sections with their categories
    const results = [];
    sections.forEach(section => {
      const category = section.get('category');
      const result = {
        id: section.get('id'),
        value: `${category.get('title')} / ${section.get('title')}`,
        categoryName: category.get('title'),
        sectionName: section.get('title')
      };
      results.push(result);
    });
    
    return results;
  }).restartable(),

  visibleTags: computed('article.tags.@each.name', function() {
    return this.get('article.tags').filter(tag => {
      return !isInternalTag(tag);
    });
  }),

  suggestTags: task(function * (searchTerm) {
    yield timeout(300);
    const tags = yield this.get('store').query('tag', { name: searchTerm });
    let result = tags.mapBy('name').map(name => ({ name }));
    return result;
  }).restartable(),

  updateCategoriesTreeWithSection(sectionInfo, setAsSelected = false) {
    if (!sectionInfo) {
      return;
    }
      
    const tree = this.get('categoriesTree') || [];
    
    const { id, categoryName, sectionName } = sectionInfo;
    
    // Check if the category already exists in the tree
    let categoryNode = tree.findBy('value', categoryName);
    
    // If category doesn't exist, create it
    if (!categoryNode) {
      categoryNode = {
        value: categoryName,
        children: []
      };
      tree.push(categoryNode);
    }
    
    // Check if the section already exists in the category
    let sectionNode = categoryNode.children.findBy('id', id);
    
    // If section doesn't exist, add it
    if (!sectionNode) {
      sectionNode = {
        id: id,
        value: sectionName
      };
      categoryNode.children.push(sectionNode);
    }
    
    // Update the tree
    this.set('categoriesTree', [...tree]);
    
    // If setAsSelected is true, also set this section as the selected one
    if (setAsSelected && id) {
      this.set('article.section', id);
    }
  },

  loadArticleSection() {
    const article = this.get('originalArticle');
    const sectionId = article ? article.section : null;
    
    if (!sectionId) {
      return;
    }

    // Check if the section exists in the tree
    let sectionExists = false;
    const tree = this.get('categoriesTree') || [];
    
    tree.forEach(category => {
      const foundSection = category.children.findBy('id', sectionId);
      if (foundSection) {
        sectionExists = true;
      }
    });
    
    // If the section doesn't exist in the tree, fetch it directly
    if (sectionExists) {
      return;
    }
    const store = this.get('store');
    store.findRecord('section', sectionId).then(section => {
      if (!section) {
        return;
      }
      
      const category = section.get('category');
      
      // Create section info
      const sectionInfo = {
        id: section.get('id'),
        value: section.get('title'),
        categoryName: category.get('title'),
        sectionName: section.get('title')
      };
      
      // Add to the tree and set as selected in one operation
      this.updateCategoriesTreeWithSection(sectionInfo, true);
    });
  },

  actions: {
    updateArticleContent(content) {
      const selectedLocale = this.get('selectedLocale');
      const defaultLocale = this.get('locale.accountDefaultLocaleCode');
      const articleContents = this.get('article.contents');
      const articleTitles = this.get('article.titles');
    
      const contentIndex = articleContents.findIndex(c => c.locale === selectedLocale);
      const titleIndex = articleTitles.findIndex(t => t.locale === selectedLocale);
    
      const removeTitleAndContent = () => {
        if (titleIndex > -1) articleTitles.removeAt(titleIndex);
        if (contentIndex > -1) articleContents.removeAt(contentIndex);
      };
    
      const updateContent = () => {
        if (contentIndex > -1) {
          this.set(`article.contents.${contentIndex}.translation`, content);
        } else {
          articleContents.pushObject({ locale: selectedLocale, translation: content });
        }
      };
    
      const ensureTitleExists = () => {
        if (titleIndex < 0) {
          articleTitles.pushObject({ locale: selectedLocale, translation: '' });
        }
      };
    
      if (!content && selectedLocale !== defaultLocale) {
        const titleEmpty = (titleIndex > -1 && !articleTitles[titleIndex].translation) || titleIndex < 0;
        if (titleEmpty) {
          removeTitleAndContent();
        } else {
          updateContent();
        }
      } else {
        updateContent();
      }
    
      if (content) {
        ensureTitleExists();
      }
    },

    updateArticleTitle(title) {
      const selectedLocale = this.get('selectedLocale');
      const defaultLocale = this.get('locale.accountDefaultLocaleCode');
      const articleTitles = this.get('article.titles');
      const articleContents = this.get('article.contents');
    
      const titleIndex = articleTitles.findIndex(t => t.locale === selectedLocale);
      const contentIndex = articleContents.findIndex(c => c.locale === selectedLocale);
    
      const removeTitleAndContent = () => {
        if (titleIndex > -1) articleTitles.removeAt(titleIndex);
        if (contentIndex > -1) articleContents.removeAt(contentIndex);
      };
    
      const updateTitle = () => {
        if (titleIndex > -1) {
          this.set(`article.titles.${titleIndex}.translation`, title);
        } else {
          articleTitles.pushObject({ locale: selectedLocale, translation: title });
        }
      };
    
      const ensureContentExists = () => {
        if (contentIndex < 0) {
          articleContents.pushObject({ locale: selectedLocale, translation: '' });
        }
      };
    
      if (!title && selectedLocale !== defaultLocale) {
        const contentEmpty = (contentIndex > -1 && !articleContents[contentIndex].translation) || contentIndex < 0;
        if (contentEmpty) {
          removeTitleAndContent();
        } else {
          updateTitle();
        }
      } else {
        updateTitle();
      }
    
      if (title) {
        ensureContentExists();
      }
    },
    

    updateSelectedLocale(newLocale) {
      this.set('selectedLocale', newLocale.code);
    },

    changeSectionValue(value) {
      // If this is a search result (has 'id' property directly)
      if (value && value.id && value.categoryName && value.sectionName) {        
        // Add the selected section to the categoriesTree and set it as selected
        this.updateCategoriesTreeWithSection(value, true);
      } else {
        this.set('article.section', get(value, 'id'));
      }
    },

    async save() {
      try {
        this.set('isSaving', true);
        const article = this.get('article');
        const errors = {};

        for (const title of article.titles) {
          if (!title.translation) {
            if (!errors.titles) {
              errors.titles = [];
            }
            const localeLanguage = this.get('locale').getLocaleLanguage(title.locale);
            errors.titles.push({ message: this.get('i18n').t('admin.knowledgebase.errors.title_required', { localeLanguage }) });
          }
        }

        for (const content of article.contents) {
          if (!content.translation) {
            if (!errors.contents) {
              errors.contents = [];
            }
            const localeLanguage = this.get('locale').getLocaleLanguage(content.locale);
            errors.contents.push({ message: this.get('i18n').t('admin.knowledgebase.errors.content_required', { localeLanguage }) });
          }
        }

        if (article.attachments.length > 0) {
          const anyFileUploading = article.attachments.find(a => a.isUploading);
          if (anyFileUploading) {
            errors.attachments = [{message: this.get('i18n').t('admin.knowledgebase.errors.wait_for_upload')}];
          }
        }
        if (Object.keys(errors).length > 0 ) {
          this.set('article.errors', errors);
          return;
        }
  
        const newArticle = {
          titles: article.titles,
          contents: article.contents,
          status: article.status,
          section_id: article.section,
          author_id: article.author.id,
          keywords: article.searchKeywords,
          tags: article.tags ? article.tags.map(t => t.name).join(',') : '',
          files: article.attachments,
          is_featured: !!article.pinArticle,
          allow_comments: !!article.allowComments,
          attachment_file_ids: article.attachments.map(file => file.attachmentId).join(',')
        };
  
        const store = this.get('store');
        const articleAdapter = store.adapterFor('article');
  
        if (article.id) {
          const originalArticle = this.get('originalArticle');
          const removedAttachments = originalArticle.attachments.filter(originalAttachment => {
            return !article.attachments.some(currentAttachment => 
              currentAttachment.name === originalAttachment.name && 
              currentAttachment.size === originalAttachment.size
            );
          });
          if (removedAttachments.length > 0) {
            await Promise.all(removedAttachments.map(async (attachment) => {
              return articleAdapter.removeAttachment(article.id, attachment.id);
            }));
          }
          await articleAdapter.updateArticle(article.id, newArticle);
          this.get('articleEvents').articleUpdated();
          this.set('originalArticle', JSON.parse(JSON.stringify(article)));
          this.onSave();
        } else {
          const createdArticle = await articleAdapter.addArticle(newArticle);
          await this.get('router').transitionTo('session.agent.knowledgebase.article-view', createdArticle.id);
          this.get('articleEvents').articleCreated();
        }
      } catch (err) {
        this.get('notification').error(this.get('i18n').t('generic.generic_error'));
      } finally {
        this.set('isSaving', false);
      }
    },

    addTag(tag) {
      const article = this.get('article');
      const newTags = [...article.tags];
      newTags.push(tag);
      this.set('article.tags', newTags);
    },

    removeTag(tag) {
      const article = this.get('article');
      article.tags.removeObject(tag);
      this.set('article.tags', article.tags);
    },

    onUploadAttachments(files, overwrite) {
      if (this.get('article.errors.attachments')) {
        this.set('article.errors.attachments', null);
      }
      const article = this.get('article');
      if (overwrite) {
        this.set('article.attachments', files);
      } else {
        const combinedAttachments = [...article.attachments];
        for (const file of files) {
          if (file.isUploading) {
            combinedAttachments.push(file);
          } else {
            const indexToUpdate = combinedAttachments.findIndex(f => f.name === file.name && f.size === file.size);
            if (indexToUpdate > -1) {
              if (file.status === 'ERROR') {
                if (!this.get('article.errors')) {
                  this.set('article.errors', {});
                }
                if (file.error === 'TOO_LARGE') {
                  this.set('article.errors.attachments', [{ message: this.get('i18n').t('admin.knowledgebase.errors.file_too_large') }]);
                } else {
                  this.set('article.errors.attachments', [{ message: this.get('i18n').t('admin.knowledgebase.errors.file_upload_error') }]);
                }
                combinedAttachments.splice(indexToUpdate, 1);
              } else {
                combinedAttachments[indexToUpdate] = file;
              }
            }
          }
        }
        this.set('article.attachments', combinedAttachments);
      }
    },

    handleImageUpload(component, response) {
      // Overriding the default image upload handler to fetch the image URL from the response
      // https://wysiwyg-editor.froala.help/hc/en-us/articles/115000593909-How-can-I-use-a-different-image-response
      const editor = component.get('editor');
      const parsedResponse = JSON.parse(response);
      var imageUrl = new URL(parsedResponse.data[0].attachment.url.replace('/media/', '/base/media/'));
      editor.image.insert(imageUrl.pathname, false, parsedResponse, editor.image.get(), response);
      return false;
    },

    handleImageToolbarOpen(component) {
      // Add a class explicitly to the image edit toolbar to make it visible
      component.get('editor').popups.get('image.edit').addClass('image-edit-toolbar-visible');
    }
  }
});
