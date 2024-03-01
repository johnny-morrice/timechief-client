class MediaDecorator {
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
            if (data.media.picture && data.media.picture.pictures) {
                const myPictures = data.media.picture.pictures.map(picture => {
                    picture.url = this.makePictureURL(picture.filename);
                    return picture;
                });
                data.media.picture.pictures = myPictures;
            }
        }
        return data;
    }
}

exports.MediaDecorator = MediaDecorator;