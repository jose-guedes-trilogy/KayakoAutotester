import { imagify } from 'frontend-cp/helpers/ko-imagify';
import { module, test } from 'qunit';

module('Unit | Helper | ko imagify');

test('Image in square brackets', function(assert) {
  assert.equal(imagify(['[img src="foo.png"]']).toHTML(), '<img src="foo.png" />', 'creates an image element with correct src');
});

test('Image as IMG tag', function(assert) {
  assert.equal(imagify(['<img src="foo.png" />']).toHTML(), '<img src="foo.png" />', 'remains untouched');
});

test('Image in text content', function(assert) {
  assert.equal(imagify(['Text before[img src="foo.png"]and after image.']).toHTML(),
    'Text before<img src="foo.png" />and after image.', 'renders correctly');
});

test('Image in text content with space after image', function(assert) {
  assert.equal(imagify(['Text before[img src="foo.png" width="200"] and after image but space after.']).toHTML(),
    'Text before<img src="foo.png" width="200" /> and after image but space after.', 'renders correctly');
});

test('Image with height attribute', function(assert) {
  assert.equal(imagify(['Text with space before [img src="foo.png" height="40"]image and after.']).toHTML(),
    'Text with space before <img src="foo.png" height="40" />image and after.', 'renders correctly');
});

test('Image in broken format', function(assert) {
  assert.equal(imagify(['[imgsrc="foo.png"]']).toHTML(),
    '[imgsrc="foo.png"]', 'remains untouched');
});

test('Image with all attributes', function(assert) {
  assert.equal(imagify(['[img src="foo.png" height="80" width="80" title="A picture of the eclipse" alt="Eclipse y\'all!"]']).toHTML(),
    '<img src="foo.png" height="80" width="80" title="A picture of the eclipse" alt="Eclipse y\'all!" />', 'renders correctly with all attributes');
});

test('Two images in a line', function(assert) {
  assert.equal(imagify(['[img src="foo.png"] hello world [img src="foo.png"]']).toHTML(),
    '<img src="foo.png" /> hello world <img src="foo.png" />', 'renders correctly with two images');
});

test('Two images in a line with multiple attributes', function(assert) {
  assert.equal(imagify(['[img src="foo.png" height=20] hello world [img src="foo.png" width=40]']).toHTML(),
    '<img src="foo.png" height=20 /> hello world <img src="foo.png" width=40 />', 'renders correctly with two images plus attributes');
});

test('Three images in a line', function(assert) {
  assert.equal(imagify(['[img src="foo.png"] hello world [img src="foo.png"] hello world again [img src="foo.png"]']).toHTML(),
    '<img src="foo.png" /> hello world <img src="foo.png" /> hello world again <img src="foo.png" />', 'renders correctly with two images');
});

test('Two images in a line with a space after the first image', function(assert) {
  assert.equal(imagify(['[img src="foo.png"]hello world [img src="foo.png"]']).toHTML(),
    '<img src="foo.png" />hello world <img src="foo.png" />', 'renders correctly with two images');
});

test('Two images in a line with a space before the last image', function(assert) {
  assert.equal(imagify(['[img src="foo.png"] hello world[img src="foo.png"]']).toHTML(),
    '<img src="foo.png" /> hello world<img src="foo.png" />', 'renders correctly with two images');
});

test('Two images in a line without a space', function(assert) {
  assert.equal(imagify(['[img src="foo.png"]hello_world[img src="foo.png"]']).toHTML(),
    '<img src="foo.png" />hello_world<img src="foo.png" />', 'renders correctly with two images');
});
