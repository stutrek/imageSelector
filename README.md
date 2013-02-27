# Responsive Image Selector

The image selector takes a list of cuts and chooses the best fit for the available space. It can be used automatically with data- attributes or manually with JavaScript.

## Basic Usage

```html
<img data-cuts='[ { width:100, src="/path/to/small" }, { width:200, src:"/path/to/large" } ]' style="width: 100px" />

<scrpt>
	imageSelector.selectImages(document.body);
</scrpt>
```

## Giving the Image Selector Options

The image selector uses a JSON array of possible image cuts and picks the correct one. These must have `width` and `src` attributes, `aspectRatio` is optional.

```javascript
[
	{
		"width": 100,
		"aspectRatio": "16:9",
		"src": "http://placehold.it/100x56"
	},
	{
		"width": 200,
		"aspectRatio": "16:9",
		"src": "http://placehold.it/200x112"
	}
]

```

The image selector looks for this array in the `data-cuts` attribute of an image.

```html
<img data-cuts="[...the above array...]" data-aspect-ratio="16:9" data-src-attribute="data-src" />
```

## Options

* `data-aspect-ratio` - the image selector will ignore images without this aspect ratio.
* `data-src-attribute` - the image selector will use this attribute instead of the `src` attribute. Use this for lazy loading.