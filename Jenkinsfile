pipeline {
  agent any

  options {
    timestamps()
  }

  environment {
    PYTHONUNBUFFERED = '1'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Setup Python') {
      steps {
        // Assumes Jenkins agent already has Python available on PATH
        bat 'python --version'
        bat 'python -m pip install --upgrade pip'
      }
    }

    stage('Install dependencies') {
      steps {
        bat 'pip install -r requirements.txt -r requirements-dev.txt'
      }
    }

    stage('Run tests') {
      steps {
        bat 'pytest -q'
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: '**/*.log', allowEmptyArchive: true
    }
  }
}

