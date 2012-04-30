cjLightBox
===========

A javascript cross-platform compatible (hopefully) photo light box plug-in for MooTools.

How to use
----------

Syntax:

	var myLightBox = new cjLightBox([options]);

Arguments:

1. options - (object,optional) The options of how the light box behaves.

Options:

1. idPrefix - (string: defaults to 'cjLightBox') The layer id of the DOM element which contains the cjLightBox.
2. loopView - (boolean: defaults to false) If the gallery should rewind to the first photo when clicking 'next' on the last.
3. localeOptions - (object)
   * phraseClose - (string: defaults to '[CLOSE]') Text of the close button on the upper right corner of the box.
   * phrasePrevious - (string: defaults to 'PREV') Text of the previous button overlay on the photo.
   * phraseNext - (string: defaults to 'NEXT') Text of the next button overlay on the photo.
4. maskOptions - (object)
   * useMask - (boolean: defaults to true) If the box should also make a mask layer on top of the entire page when shown. The style of the mask can be adjusted in the CSS file as needed.
   * tweenTo - (number: defaults to 0.9) If the mask should apply an Fx.Tween effect when shown or hidden. Setting this value to anything other than a number will make it as false.
5. keyboardOptions - (object)
   * useKeyboard - (boolean: defaults to true) If the box should listen to keyboard events when it's shown.
   * closeKeys - (array) The key codes for closing the box.
   * nextKeys - (array) The key codes for showing the next photo.
   * prevKeys - (array) The key codes for showing the previous photo.

Public Methods
--------------

* setGalleryData(data) - To set data of the gallery. The method should be set when the box is not, and BEFORE showing.
  1. data - (object)
   data - (object) Data of the gallery, structured as below:
	{
		title : 'Name of the album',	// Can be empty string.
		pdir : 'path/to/photo/files',	// Where the files are stored.
		plist : [						// List of photos in an array to be displayed.
										// List items can be either type of array or string.
			['1.jpg', 'My Dog'],		// Array containing file name and the title of photo.
			'2.jpg'						// String of a file, the title will be auto replaced with the album name.
		]
	}

* showPhoto([index]) - Open the box if it's not already opened, and show the specific photo.
  1. index - (number,optional) The index number of photo you want to show. If not present, will show the first one.

* continueView(direction) - Show the next or previous photo in the gallery.
  1. direction - (number) This can be either negative or positive number. If negative, the box will show the previous photo, and next photo if positive.

Full Example
------------

	var photoBox = new cjLightBox({
	});
	photoBox.setGalleryData({
		title : 'My Family Album',
		pdir : 'photo/family',
		plist : [
			['1.jpg', 'Mom'],
			['2.jpg', 'Dad'],
			'sister.png',
			'thedog.png'
		]
	});
	photoBox.showPhoto(1);

Notes
-----

* There is only ONE instance of the cjLightBox can be existing on the same page. I'm not sure if it's really neccessary to keep multiple existing, but for not, it doesn't.

* Initializing the instance will also create a global variable pointing to the instance: window.__cjLightBoxInstance

* The structure of photo box is shown as below:

	<div id="cjLightBoxMask" style="width:2000px;height:2000px;"></div>
	<div id="cjLightBox">
		<div id="cjLightBoxHead">
			<div id="cjLightBoxHeadTitle">This is a test...</div>
			<div id="cjLightBoxHeadClose">[CLOSE]</div>
		</div>
		<div id="cjLightBoxContent">
			<div id="cjLightBoxContentPrev">
				<span id="cjLightBoxContentPrevBtn">PREV</span>
			</div>
			<div id="cjLightBoxContentNext">
				<span id="cjLightBoxContentNextBtn">PREV</span>
			</div>
			<div id="cjLightBoxContentLoading"></div>
			<div id="cjLightBoxContentMask"></div>
			<img id="cjLightBoxContentPhoto" src="photo.jpg" alt="Test" />
		</div>
		<div id="cjLightBoxFoot">
			<ul id="cjLightBoxFootUL">
				<li></li>
				<li></li>
			</ul>
		</div>
	</div>
