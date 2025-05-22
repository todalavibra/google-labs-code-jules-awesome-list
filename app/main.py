from flask import Flask, render_template, url_for

MOCK_VIDEOS = [
    {
        "id": 1,
        "title": "Amazing Nature Scenery",
        "description": "A beautiful time-lapse of a mountain range.",
        "filename": "sample_video_1.mp4"
    },
    {
        "id": 2,
        "title": "Cute Cat Antics",
        "description": "Funny moments with a playful kitten.",
        "filename": "sample_video_2.mp4"
    },
    {
        "id": 3,
        "title": "Urban Exploration",
        "description": "Exploring hidden gems in the city.",
        "filename": "sample_video_3.mp4"
    }
]

app = Flask(__name__)

@app.route('/')
def home():
    videos = MOCK_VIDEOS
    return render_template('index.html', videos=videos)

@app.route('/player/<int:video_id>')
def play_video(video_id):
    video = next((v for v in MOCK_VIDEOS if v['id'] == video_id), None)
    if video:
        return render_template('player.html', video=video)
    else:
        return "Video not found", 404

if __name__ == '__main__':
    app.run(debug=True)
