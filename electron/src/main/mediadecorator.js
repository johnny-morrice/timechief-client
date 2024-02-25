export class MediaDecorator {
    constructor() {
        this.mediaRoot = `${process.env.clockAPIBaseURL}/media`;
    }

    makeVideoPath(fileName) {
        return `${this.mediaRoot}/video/${fileName}`;
    }

    decorateData(data) {
        if (data && data.media && data.media.videos) {
            const myVideos = data.media.videos.map(video => {
                video['path'] = this.makeVideoPath(video['filename']);
            });
            data['videos'] = myVideos;
        }
        return data;
    }
}

exports.MediaDecorator = MediaDecorator;