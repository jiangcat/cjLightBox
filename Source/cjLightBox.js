/*
---
description: A javascript cross-platform compatible (hopefully) photo light box plug-in for MooTools.

license: MIT-style

authors:
- Chris Jiang

requires:
 - core/1.4.5:   '*'
 - more:1.4.0.1/Element.Measure
 - more:1.4.0.1/Keyboard

provides:
 - cjLightBox
...
*/

(function(){


var cjLightBox = this.cjLightBox = new Class({
	_resizeTimeout : null,
	_appData : {},
	_EL : {},
	_FX : {},
	_galleryData: [],

	Implements: [Options, Events],

	options: {
		idPrefix: 'cjLightBox',
		loopView: false,
		localeOptions: {
			phraseClose: '[CLOSE]',
			phrasePrevious: 'PREV',
			phraseNext: 'NEXT',
		},
		maskOptions: {
			useMask: true,
			tweenTo: 0.9
		},
		keyboardOptions: {
			useKeyboard: true,
			closeKeys: ['esc'],
			nextKeys: ['right', 'space'],
			prevKeys: ['left']
		}
	},

	// ===============================================
	// Clear everything to prepare loading
	// ===============================================
	_clearCurrentDisplay : function(keepHeadFoot){
		if ( !keepHeadFoot ) {
			this._EL.cjLightBoxHead.setStyle('display', 'none');
			this._EL.cjLightBoxFoot.setStyle('display', 'none');
			this._EL.cjLightBox.setStyle('width', this._computeElSize(this._EL.cjLightBoxContent).totalWidth);
			this._EL.cjLightBox.setStyle('height', this._computeElSize(this._EL.cjLightBoxContent).totalHeight);
		}
		else {
			this._EL.cjLightBoxHead.setStyle('visibility', 'hidden');
			this._EL.cjLightBoxFoot.setStyle('visibility', 'hidden');
		}
		this._EL.cjLightBoxHeadTitle.empty();
		this._EL.cjLightBoxContentPrev.setStyle('display', 'none');
		this._EL.cjLightBoxContentNext.setStyle('display', 'none');
		this._EL.cjLightBoxContentMask.setStyle('opacity', 1);
		this._EL.cjLightBoxContentMask.setStyle('display', 'none');

		if ( this._EL.cjLightBoxContentPhoto ) {
			this._EL.cjLightBoxContentPhoto.setStyle('display', 'none');
			this._EL.cjLightBoxContentPhoto.destroy();
			this._EL.cjLightBoxContentPhoto = null;
		}
	},

	// ===============================================
	// Open the light box
	// ===============================================
	_open : function(){
		if ( this._EL.cjLightBox.getStyle('display') != 'none' )
			return;
		this._EL.cjLightBox.setStyle('display', '');
		window.addEvent('resize', window.__cjLightBoxInstance._resizeFunc);
		if ( this.options.maskOptions.useMask ) {
			if ( this.options.maskOptions.tweenTo && typeOf(this.options.maskOptions.tweenTo) == 'number' ) {
				this._EL.cjLightBoxMask.setStyle('display', '');
				this._FX.bodyMask.start('opacity', this.options.maskOptions.tweenTo);
//				this._EL.cjLightBoxMask.tween('opacity', this.options.maskOptions.tweenTo);
			}
			else {
				this._EL.cjLightBoxMask.setStyle('display', 'none');
			}
		}
	},

	// ===============================================
	// Close the light box
	// ===============================================
	close : function(){
		window.removeEvent('resize', window.__cjLightBoxInstance._resizeFunc);
		this._EL.cjLightBoxHead.setStyle('display', 'none');
		this._EL.cjLightBoxFoot.setStyle('display', 'none');
		this._EL.cjLightBoxContent.removeClass('loading');
		this._EL.cjLightBoxContent.setStyle('display', 'none');
		this._EL.cjLightBoxContentPhoto.setStyle('display', 'none');
		this._EL.cjLightBox.setStyle('display', 'none');
		this._EL.cjLightBox.setStyle('width', this._appData.frameOriW);
		this._EL.cjLightBox.setStyle('height', this._appData.frameOriH);
		this._elPosition(this._EL.cjLightBox, {});
		if ( this.options.maskOptions.useMask ) {
			if ( this.options.maskOptions.tweenTo && typeOf(this.options.maskOptions.tweenTo) == 'number' ) {
				this._FX.bodyMask.start('opacity', 0).chain(function(){
					this._EL.cjLightBoxMask.setStyle('display', 'none');
				}.bind(this));
			}
			else {
				this._EL.cjLightBoxMask.setStyle('display', 'none');
			}
		}
	},

	// ===============================================
	// Generate and show PREV/NEXT button overlay
	// ===============================================
	_showNextPrevBtn: function(justResize){
		if ( this._galleryData.plist.length < 2 )
			return;
		var picDim = this._EL.cjLightBoxContentPhoto.getDimensions();
		if ( this.options.loopView || this._appData.showingIdx > 0 ) {
			if ( !justResize ) {
				this._EL.cjLightBoxContentPrevBtn.setStyle('opacity', 0);
				this._EL.cjLightBoxContentPrev.setStyle('display', '');
			}
			this._EL.cjLightBoxContentPrev.setStyle('height', picDim.height);
			this._EL.cjLightBoxContentPrev.setStyle('width', Math.floor(picDim.width/2));
			this._elPosition(this._EL.cjLightBoxContentPrevBtn, {
				parentEl : this._EL.cjLightBoxContentPrev,
				x : 'left'
			});
		}
		if ( this.options.loopView || this._appData.showingIdx < this._galleryData.plist.length - 1 ) {
			if ( !justResize ) {
				this._EL.cjLightBoxContentNextBtn.setStyle('opacity', 0);
				this._EL.cjLightBoxContentNext.setStyle('display', '');
			}
			this._EL.cjLightBoxContentNext.setStyle('height', picDim.height);
			this._EL.cjLightBoxContentNext.setStyle('width', Math.ceil(picDim.width/2));
			this._elPosition(this._EL.cjLightBoxContentNextBtn, {
				parentEl : this._EL.cjLightBoxContentNext,
				x : 'right'
			});
		}
	},

	// ===============================================
	// Generate footer dots
	// ===============================================
	_generateFooterLis : function(idx) {
		var i, lidif, lis = this._EL.cjLightBoxFootUL.getChildren('li');
		if ( lis.length < this._galleryData.plist.length ) {
			lidif = this._galleryData.plist.length - lis.length;
			for ( i=0; i<lidif; i++ ) {
				var newli = new Element('li');
				newli.addEvents({
					'mouseover' : function(){
						this.setStyle('cursor', 'pointer');
					},
					'mouseout' : function(){
						this.setStyle('cursor', 'auto');
					},
					'mouseup' : function(){
						window.__cjLightBoxInstance.showPhoto(this.retrieve('photoIdx'));
					}
				});
				newli.inject(this._EL.cjLightBoxFootUL);
			}
		}
		else if ( lis.length > this._galleryData.plist.length ) {
			lidif = lis.length - this._galleryData.plist.length;
			for ( i=0; i<lidif; i++ ) {
				lis.pop().destroy();
			}
		}
		lis = this._EL.cjLightBoxFootUL.getChildren('li');
		lis.each(function(el, lidx){
			el.store('photoIdx', lidx);
			if ( lidx != idx ) {
				el.removeClass('active');
			}
			else {
				el.addClass('active');
			}
		});
	},

	// ===============================================
	// Turn to the next photo if avaliable
	// ===============================================
	continueView : function(step) {
		var tarIdx = this._appData.showingIdx + step;
		if ( tarIdx >= this._galleryData.plist.length ) {
			if ( this.options.loopView )
				tarIdx = 0;
			else
				return;
		}
		else if ( tarIdx < 0 ) {
			if ( this.options.loopView )
				tarIdx = this._galleryData.plist.length-1;
			else
				return;
		}
		this._clearCurrentDisplay(true);
		this.showPhoto(tarIdx);
	},

	// ===============================================
	// Trigger a function when window is resized
	// ===============================================
	_resizeFunc : function() {
		/*
		if ( this._resizeTimeout )
			clearTimeout(this._resizeTimeout);
		this._resizeTimeout = (function(){
			window.__cjLightBoxInstance._resizeExecution();
		}).delay(200);
		*/
		window.__cjLightBoxInstance._resizeExecution();
	},

	// ===============================================
	// Actuall code to execute when window is resized
	// ===============================================
	_resizeExecution : function() {
		var newWinW = window.getSize().x, newWinH = window.getSize().y, sizesData = this._calculateFrameSizes();

		this._EL.cjLightBoxContentMask.setStyle('width', sizesData.contW);
		this._EL.cjLightBoxContentMask.setStyle('height', sizesData.contH);
		this._EL.cjLightBoxContent.setStyle('width', sizesData.contW);
		this._EL.cjLightBoxContent.setStyle('height', sizesData.contH);
		this._EL.cjLightBoxContentPhoto.setStyle('width', sizesData.contW);
		this._EL.cjLightBoxContentPhoto.setStyle('height', sizesData.contH);
		this._EL.cjLightBox.setStyle('width', sizesData.contW);
		this._EL.cjLightBox.setStyle('height', sizesData.contH+sizesData.hExtra);

		var frameTarPos = this._elPosition([(sizesData.contW+sizesData.wExtra), (sizesData.contH+sizesData.hExtra)]);
		this._EL.cjLightBox.setStyle('top', frameTarPos.y);
		this._EL.cjLightBox.setStyle('left', frameTarPos.x);

		this._showNextPrevBtn(true);

		if ( this.options.maskOptions.useMask ) {
			this._EL.cjLightBoxMask.setStyle('width', newWinW);
			this._EL.cjLightBoxMask.setStyle('height', newWinH);
		}
	},

	// ===============================================
	// Calculate the max layer and container size
	// ===============================================
	_calculateFrameSizes : function() {
		var picDim = {width:this._appData.picWidth, height:this._appData.picHeight};
		var winSize = window.getSize(), 
			frameSize = this._computeElSize(this._EL.cjLightBox), 
			hExtra = frameSize['padding-top'] + frameSize['border-top-width'] + frameSize['padding-bottom'] + frameSize['border-bottom-width'] + this._appData.headH + this._appData.footH,
			wExtra = frameSize['padding-right'] + frameSize['border-right-width'] + frameSize['padding-left'] + frameSize['border-left-width'],
			contW, contH;
		contH = winSize.y - 100 - hExtra;
		contW = winSize.x - 100 - wExtra;
		if ( picDim.width > contW || picDim.height > contH ) {
			var percH = (picDim.height - contH) / picDim.height,
				percW = (picDim.width - contW) / picDim.width;
			if ( percH < percW ) {
				contW = Math.floor(picDim.width*(1-percW));
				contH = Math.floor(picDim.height*(1-percW));
			}
			else {
				contW = Math.floor(picDim.width*(1-percH));
				contH = Math.floor(picDim.height*(1-percH));
			}
		}
		else {
			contW = picDim.width;
			contH = picDim.height;
		}
		return {
			contW : contW,
			contH : contH,
			wExtra : wExtra,
			hExtra : hExtra
		};
	},

	// ===============================================
	// Photo loaded successfully
	// ===============================================
	_loadPhotoSucc : function(el) {
		el.inject(this._EL.cjLightBoxContent);

		var picDim = {width:el.naturalWidth, height:el.naturalHeight};
		this._appData.picWidth = el.naturalWidth;
		this._appData.picHeight = el.naturalHeight;

		var sizesData = this._calculateFrameSizes();

		this._EL.cjLightBoxContentMask.setStyle('width', sizesData.contW);
		this._EL.cjLightBoxContentMask.setStyle('height', sizesData.contH);
		this._EL.cjLightBoxContentMask.setStyle('display', 'none');
		this._EL.cjLightBoxContent.setStyle('display', 'none');
		this._EL.cjLightBoxContent.removeClass('loading');
		el.setProperty('id', 'cjLightBoxContentPhoto');
		this._EL.cjLightBoxContentPhoto = el;
		this._EL.cjLightBoxContentPhoto.setStyle('display', 'none');

		var frameTarPos = this._elPosition([(sizesData.contW+sizesData.wExtra), (sizesData.contH+sizesData.hExtra)]);
		
		this._FX.mainFrame.start({
			'height' : (sizesData.contH+sizesData.hExtra),
			'top' : frameTarPos.y
		}).start({
			'width' : sizesData.contW,
			'left' : frameTarPos.x
		}).chain(function(){
			this._EL.cjLightBoxHead.setStyle('opacity', 0);
			this._EL.cjLightBoxHead.setStyle('visibility', 'visible');
			this._EL.cjLightBoxHead.setStyle('display', '');
			this._FX.head.start('opacity', 1);
			this._EL.cjLightBoxFoot.setStyle('opacity', 0);
			this._EL.cjLightBoxFoot.setStyle('visibility', 'visible');
			this._EL.cjLightBoxFoot.setStyle('display', '');
			this._FX.foot.start('opacity', 1);
			this._EL.cjLightBoxContent.setStyle('display', '');
			this._EL.cjLightBoxContent.setStyle('width', sizesData.contW);
			this._EL.cjLightBoxContent.setStyle('height', sizesData.contH);
			this._EL.cjLightBoxContentPhoto.setStyle('width', sizesData.contW);
			this._EL.cjLightBoxContentPhoto.setStyle('height', sizesData.contH);
			this._EL.cjLightBoxContentPhoto.setStyle('display', '');
			this._EL.cjLightBoxContentMask.setStyle('display', '');
			this._FX.contentMask.start('opacity', 0);
			this._showNextPrevBtn();
		}.bind(this));
	},

	// ===============================================
	// Start to load photo
	// ===============================================
	_loadPhoto : function(idx) {
		this._appData.showingIdx = idx;
		this._generateFooterLis(idx);

		var imgurl = this._galleryData.pdir, 
			imgtitle = this._galleryData.title, 
			imgdata = this._galleryData.plist[idx];
		if ( imgurl.substr(-1) != '/' )
			imgurl += '/';
		if ( typeOf(imgdata) == 'array' && imgdata.length > 1 ) {
			imgurl += imgdata[0];
			imgtitle = imgdata[1];
		}
		else {
			imgurl += imgdata;
		}

		this._appData.showingURL = imgurl;

		this._clearCurrentDisplay(1);
		this._EL.cjLightBoxHeadTitle.set('text', imgtitle);

		this._EL.cjLightBoxContent.addClass('loading');

		new Element('img').addEvent('load', function(){
			if ( !this.naturalWidth ) this.naturalWidth = this.width;
			if ( !this.naturalHeight ) this.naturalHeight = this.height;
			window.__cjLightBoxInstance._loadPhotoSucc(this);
		}).set({
			src: imgurl,
			alt: imgtitle
		});
	},

	// ===============================================
	// Show a photo with optional index number
	// ===============================================
	showPhoto : function(idx){
		if ( !idx || idx < 0 )
			idx = 0;
		if ( idx > this._galleryData.plist.length-1 )
			idx = this._galleryData.plist.length-1;
		if ( this._EL.cjLightBox.getStyle('display') == 'none' )
			this._open();
		this._loadPhoto(idx);
	},

	// ===============================================
	// Set gallery title, dir and photo list data
	// ===============================================
	setGalleryData : function(dataObj){
		this._appData.showingIdx = 0;
		this._galleryData = dataObj;
	},

	// ===============================================
	// Construct and inject all elements
	// ===============================================
	_constructElements: function(){
		this._EL.cjLightBox = new Element('div', {id:this.options.idPrefix});
			this._EL.cjLightBoxHead = new Element('div', {id:this.options.idPrefix+'Head'});
				this._EL.cjLightBoxHeadTitle = new Element('div', {id:this.options.idPrefix+'HeadTitle'});
				this._EL.cjLightBoxHeadTitle.inject(this._EL.cjLightBoxHead);
				this._EL.cjLightBoxHeadClose = new Element('div', {id:this.options.idPrefix+'HeadClose'});
				this._EL.cjLightBoxHeadClose.set('text', this.options.localeOptions.phraseClose);
				this._EL.cjLightBoxHeadClose.inject(this._EL.cjLightBoxHead);
			this._EL.cjLightBoxHead.inject(this._EL.cjLightBox);
			this._EL.cjLightBoxContent = new Element('div', {id:this.options.idPrefix+'Content'});
				this._EL.cjLightBoxContentPrev = new Element('div', {id:this.options.idPrefix+'ContentPrev'});
					this._EL.cjLightBoxContentPrevBtn = new Element('span', {id:this.options.idPrefix+'ContentPrevBtn'});
					this._EL.cjLightBoxContentPrevBtn.set('text', this.options.localeOptions.phrasePrevious);
					this._EL.cjLightBoxContentPrevBtn.inject(this._EL.cjLightBoxContentPrev);
				this._EL.cjLightBoxContentPrev.inject(this._EL.cjLightBoxContent);
				this._EL.cjLightBoxContentNext = new Element('div', {id:this.options.idPrefix+'ContentNext'});
					this._EL.cjLightBoxContentNextBtn = new Element('span', {id:this.options.idPrefix+'ContentNextBtn'});
					this._EL.cjLightBoxContentNextBtn.set('text', this.options.localeOptions.phraseNext);
					this._EL.cjLightBoxContentNextBtn.inject(this._EL.cjLightBoxContentNext);
				this._EL.cjLightBoxContentNext.inject(this._EL.cjLightBoxContent);
				this._EL.cjLightBoxContentMask = new Element('div', {id:this.options.idPrefix+'ContentMask'});
				this._EL.cjLightBoxContentMask.inject(this._EL.cjLightBoxContent);
				this._EL.cjLightBoxContentPhoto = new Element('img', {id:this.options.idPrefix+'ContentPhoto', src:'about:blank', alt:''});
				this._EL.cjLightBoxContentPhoto.inject(this._EL.cjLightBoxContent);
			this._EL.cjLightBoxContent.inject(this._EL.cjLightBox);
			this._EL.cjLightBoxFoot = new Element('div', {id:this.options.idPrefix+'Foot'});
				this._EL.cjLightBoxFootUL = new Element('ul', {id:this.options.idPrefix+'FootUL'});
				this._EL.cjLightBoxFootUL.inject(this._EL.cjLightBoxFoot);
			this._EL.cjLightBoxFoot.inject(this._EL.cjLightBox);
		this._EL.cjLightBox.inject(document.body);

		this._appData.headH = this._computeElSize(this._EL.cjLightBoxHead).totalHeight;
		this._appData.footH = this._computeElSize(this._EL.cjLightBoxFoot).totalHeight;
		this._appData.frameOriH = this._EL.cjLightBox.getDimensions().height;
		this._appData.frameOriW = this._EL.cjLightBox.getDimensions().width;

		// To avoid white flash when resizing in IE6
		var NextBtnSize = this._computeElSize(this._EL.cjLightBoxContentNextBtn),
			PrevBtnSize = this._computeElSize(this._EL.cjLightBoxContentPrevBtn);
		this._EL.cjLightBoxContentNextBtn.store('fixedWidth', NextBtnSize.totalWidth);
		this._EL.cjLightBoxContentNextBtn.store('fixedHeight', NextBtnSize.totalHeight);
		this._EL.cjLightBoxContentPrevBtn.store('fixedWidth', NextBtnSize.totalWidth);
		this._EL.cjLightBoxContentPrevBtn.store('fixedHeight', NextBtnSize.totalHeight);

		this._elPosition(this._EL.cjLightBox, {});

		this._EL.cjLightBox.setStyle('display', 'none');

		if ( this.options.maskOptions.useMask ) {
			this._EL.cjLightBoxMask = new Element('div', {
				'id' : this.options.idPrefix+'Mask'
			});
			this._EL.cjLightBoxMask.setStyle('width', window.getSize().x);
			this._EL.cjLightBoxMask.setStyle('height', window.getSize().y);
			this._EL.cjLightBoxMask.setStyle('display', 'none');
			if ( this.options.maskOptions.tweenTo && typeOf(this.options.maskOptions.tweenTo) == 'number' ) {
				this._EL.cjLightBoxMask.setStyle('opacity', 0);
				this._FX.bodyMask = new Fx.Tween(this._EL.cjLightBoxMask, {
					duration : 200
				});
			}
			this._EL.cjLightBoxMask.addEvent('click', function(){
				this.close();
			}.bind(this));
			this._EL.cjLightBoxMask.inject(document.body);
		}

		this._EL.cjLightBoxHeadClose.addEvents({
			'mouseover' : function(){
				this.setStyle('cursor', 'pointer');
			},
			'mouseout' : function(){
				this.setStyle('cursor', 'auto');
			},
			'mouseup' : function(){
				this.close();
			}.bind(this)
		});

		this._FX.mainFrame = new Fx.Morph(this._EL.cjLightBox, {duration:300, link:'chain'});		
		this._FX.head = new Fx.Tween(this._EL.cjLightBoxHead, {duration: 200});
		this._FX.foot = new Fx.Tween(this._EL.cjLightBoxFoot, {duration: 200});
		this._FX.contentMask = new Fx.Tween(this._EL.cjLightBoxContentMask, {duration: 200});
		this._FX.prevBtn = new Fx.Tween(this._EL.cjLightBoxContentPrevBtn, {duration: 200, link: 'cancel'});
		this._FX.nextBtn = new Fx.Tween(this._EL.cjLightBoxContentNextBtn, {duration: 200, link: 'cancel'});

		this._EL.cjLightBoxContentPrev.addEvents({
			'mouseover' : function(){
				this._FX.prevBtn.start('opacity', 1);
				this._FX.nextBtn.start('opacity', 0.5);
				this._EL.cjLightBoxContentPrev.setStyle('cursor', 'pointer');
			}.bind(this),
			'mouseout' : function(){
				this._FX.prevBtn.start('opacity', 0);
				this._FX.nextBtn.start('opacity', 0);
				this._EL.cjLightBoxContentPrev.setStyle('cursor', 'auto');
			}.bind(this),
			'mouseup' : function(){
				this.continueView(-1);
			}.bind(this)
		});
		this._EL.cjLightBoxContentNext.addEvents({
			'mouseover' : function(){
				this._FX.prevBtn.start('opacity', 0.5);
				this._FX.nextBtn.start('opacity', 1);
				this._EL.cjLightBoxContentNext.setStyle('cursor', 'pointer');
			}.bind(this),
			'mouseout' : function(){
				this._FX.prevBtn.start('opacity', 0);
				this._FX.nextBtn.start('opacity', 0);
				this._EL.cjLightBoxContentNext.setStyle('cursor', 'auto');
			}.bind(this),
			'mouseup' : function(){
				this.continueView(1);
			}.bind(this)
		});
	},

	// ===============================================
	// Object initialization
	// ===============================================
	initialize: function(options){
		this.setOptions(options);
		this._constructElements();
		window.__cjLightBoxInstance = this;
		if ( this.options.keyboardOptions.useKeyboard
			 && (!Browser.ie || Browser.version >= 9) ) {
			window.addEvents({
				'keydown': function(e){
					if ( window.__cjLightBoxInstance._EL.cjLightBox.getStyle('display') != 'none' ) {
						if ( window.__cjLightBoxInstance.options.keyboardOptions.closeKeys.contains(e.key) ) {
							e.stop();
							window.__cjLightBoxInstance.close();
						} 
						else if ( window.__cjLightBoxInstance.options.keyboardOptions.prevKeys.contains(e.key) ) {
							e.stop();
							window.__cjLightBoxInstance.continueView(-1);
						}
						else if ( window.__cjLightBoxInstance.options.keyboardOptions.nextKeys.contains(e.key) ) {
							e.stop();
							window.__cjLightBoxInstance.continueView(1);
						}
					}
				},
				'keypress': function(e){
					if ( window.__cjLightBoxInstance._EL.cjLightBox.getStyle('display') == 'none' ) 
						return;
					if ( window.__cjLightBoxInstance.options.keyboardOptions.closeKeys.contains(e.key) ) e.stop();
					else if ( window.__cjLightBoxInstance.options.keyboardOptions.prevKeys.contains(e.key) ) e.stop();
					else if ( window.__cjLightBoxInstance.options.keyboardOptions.nextKeys.contains(e.key) ) e.stop();
				}
			});
		}
	},

	// ===============================================
	// Solve MooTools 1.4.0.1 getComputedSize() missing object values in Opera
	// ===============================================
	_computeElSize : function(el) {
		var s = el.getComputedSize(), ss = {};
		if ( Browser.opera ) {
			['padding-top', 'padding-bottom', 'padding-left', 'padding-right'].each(function(k){
				ss[k] = el.getStyle(k).toInt();
			});
			['border-top', 'border-left', 'border-right', 'border-bottom'].each(function(k){
				ss[k+'-width'] = el.getStyle(k+'-style') == 'none' ? 0 : el.getStyle(k+'-width').toInt();
			});
			ss['totalWidth'] = s.width + ss['border-left-width'] + ss['border-right-width'] + ss['padding-left'] + ss['padding-right'];
			ss['totalHeight'] = s.height + ss['border-top-width'] + ss['border-bottom-width'] + ss['padding-top'] + ss['padding-bottom'];
			s = Object.merge(s, ss)
		}
		return s;
	},

	// ===============================================
	// Reposition elements relatively to a parent
	// ===============================================
	_elPosition: function(el, copts){
		opts = {
			x : 'center',
			y : 'center',
			noMove : false
		};
		if ( copts && typeOf(opts) == 'object' )
			opts = Object.merge(opts, copts);
		opts.x = opts.x.toLowerCase();
		opts.y = opts.y.toLowerCase();
		if ( !opts.parentEl ) {
			opts.parentEl = window;
		}
		var resX, resY, elSize, 
			parentSize = opts.parentEl == window 
							? {x:window.getSize().x,y:window.getSize().y} 
							: {x:this._computeElSize(opts.parentEl).width, y:this._computeElSize(opts.parentEl).height};
		if ( typeOf(el) == 'array' ) {
			opts.noMove = true;
			elSize = {totalWidth:el[0], totalHeight:el[1]};
		}
		else {
			if ( el.retrieve('fixedWidth') && el.retrieve('fixedHeight') )
				elSize = {totalWidth:el.retrieve('fixedWidth'), totalHeight:el.retrieve('fixedHeight')};
			else
				elSize = this._computeElSize(el);
		}

		switch ( opts.x ) {
			case 'l'		:
			case 'left'		:	resX = 0;
								break;
			case 'r'		:
			case 'right'	:	resX = parentSize.x - elSize.totalWidth;
								break;
			default			:	resX = Math.floor((parentSize.x - elSize.totalWidth) / 2);
								break;
		}
		switch ( opts.y ) {
			case 't'		:
			case 'top'		:	resY = 0;
								break;
			case 'b'		:
			case 'bottom'	:	resY = parentSize.y - elSize.totalHeight;
								break;
			default			:	resY = Math.floor((parentSize.y - elSize.totalHeight) / 2);
								break;
		}
		if ( !opts.noMove ) {
			switch ( opts.x ) {
				case 'l'		:
				case 'left'		:	el.setStyle('left', 0);
									el.setStyle('right', 'auto');
									break;
				case 'r'		:
				case 'right'	:	el.setStyle('left', 'auto');
									el.setStyle('right', (Browser.ie && Browser.version<9 ? -1 : 0));
									break;
				default			:	el.setStyle('left', resX);
									break;
			}
			switch ( opts.y ) {
				case 't'		:
				case 'top'		:	el.setStyle('top', 0);
									el.setStyle('bottom', 'auto');
									break;
				case 'b'		:
				case 'bottom'	:	el.setStyle('top', 'auto');
									el.setStyle('bottom', 0);
									break;
				default			:	el.setStyle('top', resY);
									break;
			}
		}
		else {
			return {x:resX, y:resY};
		}
	}

});


})();