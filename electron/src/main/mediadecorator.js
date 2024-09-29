export class MediaDecorator {
    constructor() {
        this.mediaRoot = `${process.env.clockAPIBaseURL}/media`;
    }

    makeVideoURL(fileName) {
        return `${this.mediaRoot}/video/${fileName}`;
    }

    makePictureURL(fileName) {
        return `${this.mediaRoot}/picture/${fileName}`;
    }

    decorateData(data) {
        if (data && data.media) {
            if (data.media.video && data.media.video.videos) {
                const myVideos = data.media.video.videos.map(video => {
                    video.url = this.makeVideoURL(video.filename);
                    return video;
                });
                data.media.video.videos = myVideos;
            }
            if (data.media.background_picture && data.media.background_picture.pictures) {
                const myPictures = data.media.background_picture.pictures.map(picture => {
                    picture.url = this.makePictureURL(picture.filename);
                    return picture;
                });
                data.media.background_picture.pictures = myPictures;
                if (myPictures.length > 0) {
                    const firstURL = myPictures[0].url;
                    // console.log(`setting background picture to ${myPictures[0].url}`)
                    if (data.media.background_picture.background_picture_css) {
                        let updatedCSS = data.media.background_picture.background_picture_css.replace(/__BACKGROUND_IMAGE_URL__/, firstURL);
                        data.media.background_picture.background_picture_css = updatedCSS;
                        // console.log(`updated background picture CSS: ${updatedCSS}`);
                    }
                }
            }
        }
        return data;
    }
}