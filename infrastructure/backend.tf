terraform {
  backend "gcs" {
    # To be configured dynamically per environment using:
    # terraform init -backend-config="bucket=..." -backend-config="prefix=..."
  }
}
