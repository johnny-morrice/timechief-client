class MediaDecorator {
    constructor() {
        this.mediaRoot = `${process.env.clockAPIBaseURL}/media`;
    }

    makeVideoURL(fileName) {
        return `${this.mediaRoot}/video/${fileName}`;
    }

    decorateData(data) {
        if (data && data.media && data.media.video && data.media.video.videos) {
            const myVideos = data.media.video.videos.map(video => {
                video.url = this.makeVideoURL(video.filename);
                return video;
            });
            data.media.video.videos = myVideos;
        }
        return data;
    }
}

exports.MediaDecorator = MediaDecorator;