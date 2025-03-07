from app import create_app
import os
import argparse

app = create_app()

if __name__ == '__main__':
    # Parse command-line arguments
    parser = argparse.ArgumentParser(description='Run the Flask application')
    parser.add_argument('--port', type=int, default=int(os.environ.get('PORT', 5000)),
                        help='Port to run the server on')
    args = parser.parse_args()
    
    # Run the app
    app.run(host='0.0.0.0', port=args.port) 