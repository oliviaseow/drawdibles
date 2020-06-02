# Drawdibles

Drawdibles is a creative drawing tool that listens to what a child user wants to create and completes the drawing for them, allowing children to build on their creativity and tell imaginative stories.


Watch video:

[![Drawdibles Video](https://img.youtube.com/vi/Am3od2MHZSg/0.jpg)](https://www.youtube.com/watch?v=Am3od2MHZSg)

## File structure
This folder is broken into two parts, sketch and color.

```bash
├── README.md
├── color
│   ├── config.py
│   ├── game
│   │   ├── cocos2d-js-min.js
│   │   └── main.js
│   ├── server.py
│   └── tricks.py
└── sketch
    ├── index.html
    ├── script.js
    └── style.css
```

## Sketch
Speech inputs are transcribed by the Web Speech API, and strokes are completed using sketchRNN's JavaScript model. Audio from Adobe's royalty-free sound effect database is played back for select models.

For sketching, files in the `sketch` folder can be run on a local server.

## Color
The save button allows users to retrieve completed sketches for colorizing. 

For colorizing, models need to be downloaded before running the server:

    https://drive.google.com/open?id=1gmg2wwNIp4qMzxqP12SbcmVAHsLt1iRE

A neural net with VGG-19 trained on [Danbooru2019](https://www.gwern.net/Danbooru2019) to provide global style, along with other techniques and full instructions are available [here](https://github.com/lllyasviel/style2paints).

## Resources
- [MagentaJS Sketch RNN](https://magenta.tensorflow.org/)
- [Style2Paints](https://github.com/lllyasviel/style2paints)
- [P5.js](https://p5js.org/)
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [OpenCV](https://opencv.org/releases/)
- [Tensorflow](https://pypi.org/project/tensorflow-gpu/)
- [Keras](https://keras.io/)
- [Scikit-learn](https://scikit-learn.org/stable/)