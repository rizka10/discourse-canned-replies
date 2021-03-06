import ModalFunctionality from 'discourse/mixins/modal-functionality';
import showModal from 'discourse/lib/show-modal';
import { ajax } from 'discourse/lib/ajax';
import { default as computed, observes } from 'ember-addons/ember-computed-decorators';
import { popupAjaxError } from 'discourse/lib/ajax-error';
import { cook } from 'discourse/lib/text';

export default Ember.Controller.extend(ModalFunctionality, {
  selectedReply: null,
  selectedReplyID: "",
  loadingReplies: true,

  init() {
    this._super();
    this.replies = [];
  },

  willDestroyElement() {
    this._super();
    this._setup();
  },

  _setup() {
    this.setProperties({
      selectedReply: "",
      selectedReplyID: ""
    });
  },

  @observes("selectedReplyID")
  _updateSelection() {
    this.selectionChange();
  },

  @computed("selectedReplyID")
  hasSelectedReply(selectedReplyID) {
    return selectedReplyID !== "";
  },

  @computed('selectedReply.content')
  selectedReplyCookedContent(content) {
    return cook(content);
  },

  getReplyByID(id) {
    this.get('replies').find(reply => reply.id === id);
  },

  onShow() {
    ajax("/canned_replies").then(results => {
      this.set("replies", results.replies);
      // trigger update of the selected reply
      this.selectionChange();
    }).catch(popupAjaxError).finally(() => this.set('loadingReplies', false));
  },

  selectionChange() {
    const localSelectedReplyID = this.get('selectedReplyID');
    let localSelectedReply = "";

    this.get('replies').forEach(entry => {
      if(entry.id === localSelectedReplyID){
        localSelectedReply = entry;
        return;
      }
    });

    this.set("selectedReply", localSelectedReply);
  },

  actions: {
    apply: function() {
      if (this.composerModel) {
        const newReply = this.composerModel.reply + this.selectedReply.content;
        this.composerModel.setProperties({ reply: newReply });
      }

      ajax(`/canned_replies/${this.get('selectedReplyID')}/use`, {
        type: "PATCH"
      }).catch(popupAjaxError);

      this.send('closeModal');
    },

    newReply: function () {
      this.send('closeModal');
      showModal('new-reply').setProperties({ newContent: this.composerModel.reply });
    },

    editReply: function () {
      this.send('closeModal');

      showModal('edit-reply').setProperties({
        composerModel: this.composerModel,
        replyId: this.get('selectedReplyID'),
        replyTitle: this.get('selectedReply.title'),
        replyContent: this.get('selectedReply.content')
      });
    }
  }
});
