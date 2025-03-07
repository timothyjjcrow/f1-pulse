# F1 Pulse

F1 Pulse is a comprehensive Formula 1 web application that provides real-time race updates, detailed driver and team statistics, and interactive fan engagement features.

## Features

- **Live Race Tracker**: Real-time lap times, positions, and incident updates during races.
- **Driver and Team Profiles**: Detailed stats for all 2025 drivers and teams, including career wins, points, and current standings.
- **Historical Data**: Access to past race results, championship winners, and notable records.
- **Interactive Track Maps**: Explore circuit layouts with lap records and key overtaking spots.
- **Fan Engagement Tools**: Polls, prediction games, and discussion forums.
- **Virtual Pit Stop Challenge**: An interactive educational game where users can learn about tire strategy and pit stop timing.

## Technology Stack

- **Backend**: Python with Flask
- **Frontend**: HTML, JavaScript, and CSS with Bootstrap 5
- **Database**: PostgreSQL
- **Data Source**: Ergast F1 API
- **Search**: Elasticsearch (hosted on elastic.co)

## Setup Instructions

### Prerequisites

- Python 3.9+
- PostgreSQL
- Elasticsearch account (for search functionality)

### Installation

1. Clone the repository:

   ```
   git clone https://github.com/yourusername/f1pulse.git
   cd f1pulse
   ```

2. Create a virtual environment and activate it:

   ```
   python -m venv venv
   source venv/bin/activate  # On Windows, use: venv\Scripts\activate
   ```

3. Install dependencies:

   ```
   pip install -r requirements.txt
   ```

4. Create a `.env` file from the example:

   ```
   cp .env.example .env
   ```

5. Edit the `.env` file with your database and Elasticsearch credentials.

6. Initialize the database:

   ```
   flask db init
   flask db migrate -m "Initial migration"
   flask db upgrade
   ```

7. Set up Elasticsearch (see detailed instructions below)

8. Run the application:
   ```
   flask run
   ```

### Environment Variables

Configure these variables in your `.env` file:

- `SECRET_KEY`: Secret key for the application
- `DATABASE_URL`: PostgreSQL connection string
- `ELASTIC_CLOUD_ID`: Elasticsearch Cloud ID
- `ELASTIC_API_KEY`: Elasticsearch API Key
- `ELASTIC_INDEX_PREFIX`: Prefix for Elasticsearch indices (defaults to `f1pulse_dev` for development)

### Elasticsearch Setup

F1 Pulse uses Elasticsearch for search functionality. Follow these steps to set up Elasticsearch:

1. **Create an Elastic Cloud Account**:

   - Visit [Elastic Cloud](https://www.elastic.co/cloud/cloud-trial-overview) and sign up for a free trial
   - No credit card is required for the 14-day trial

2. **Create a Deployment**:

   - After signing in, click "Create deployment"
   - Choose a deployment name (e.g., "F1Pulse")
   - Select a cloud provider (AWS, GCP, or Azure) and region
   - Choose the lowest tier deployment for testing
   - Click "Create deployment"

3. **Get Credentials**:

   - Save the password for the `elastic` user
   - Copy the Cloud ID from the deployment overview page

4. **Create an API Key**:

   - In Kibana, go to "Stack Management" > "Security" > "API Keys"
   - Click "Create API key"
   - Name it (e.g., "F1PulseAPIKey")
   - Set an appropriate expiration
   - Copy the encoded API key

5. **Update Your .env File**:

   ```
   ELASTIC_CLOUD_ID=your_cloud_id_here
   ELASTIC_API_KEY=your_api_key_here
   ELASTIC_INDEX_PREFIX=f1pulse_dev  # for development
   ```

6. **Populate Elasticsearch**:

   - Run the Elasticsearch population script:

   ```
   python populate_elasticsearch.py
   ```

7. **Manage Elasticsearch Indices**:

   - Use the Elasticsearch management utility for additional tasks:

   ```
   # List indices
   python elastic_manager.py --env dev list

   # Delete indices
   python elastic_manager.py --env dev delete all

   # Set up indices in production
   python elastic_manager.py --env prod setup
   ```

## Development

The project is structured as follows:

- `app/`: Main application package
  - `controllers/`: Route handlers
  - `models/`: Database models
  - `services/`: External API services
  - `static/`: Static files (CSS, JS, images)
  - `templates/`: HTML templates
  - `utils/`: Utility functions
  - `config/`: Configuration classes

## Testing

Run tests with pytest:

```
pytest
```

## Data Sources

- Race data is sourced from the [Ergast API](http://ergast.com/mrd/), which provides detailed Formula 1 statistics.
- Images are sourced from royalty-free platforms like [Pixabay](https://pixabay.com/), [Unsplash](https://unsplash.com/), and [Freepik](https://www.freepik.com/).

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Ergast API for providing F1 data
- Bootstrap for the frontend framework
- Flask for the web framework
- All the free image providers

## Note

This application is not affiliated with Formula 1, FIA, or any Formula 1 team. It is a fan-made project for educational and entertainment purposes only.
