import React, { useState } from 'react';
import { Container, Row, Col, Button, Form, Alert, Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUpload } from '@fortawesome/free-solid-svg-icons';
import './UploadImage.css';

function UploadImage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePredict = async () => {
    if (!selectedFile) {
      setError('Please select an image file first!');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('http://localhost:8000/predict/', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setResult(result);
    } catch (error) {
      setError('Error uploading file!');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid className="outer-container">
      <Row className="justify-content-center">
        <Col md={6}>
          <Card className="card-custom mt-5 shadow">
            <Card.Body>
              <h1 className="text-center mb-4">Cat vs Dog Classifier</h1>
              <Form>
                <Form.Group>
                  <Form.Label>Select an Image</Form.Label>
                  <Form.Control 
                    type="file" 
                    onChange={handleFileChange} 
                    accept="image/*" 
                  />
                </Form.Group>
              </Form>
              {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
              {imagePreview && (
                <>
                  <div className="image-preview-container mt-3">
                    <h5>Uploaded Image</h5>
                    <img src={imagePreview} alt="Preview" className="img-fluid" />
                  </div>
                  <Button 
                    variant="dark" 
                    onClick={handlePredict} 
                    disabled={!selectedFile || loading} 
                    className="mt-3" 
                    block
                  >
                    {loading ? 'Predicting...' : 'Predict'}
                  </Button>
                </>
              )}
              {result && (
                <>
                  {result.valid_classification ? (
                    <div className="mt-3 result-container">
                      <h5>Result</h5>
                      <p>Probability of Cat: {result.probability_cat.toFixed(2)}%</p>
                      <p>Probability of Dog: {result.probability_dog.toFixed(2)}%</p>
                    </div>
                  ) : (
                    <Alert variant="warning" className="mt-3">
                      {result.message}
                    </Alert>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default UploadImage;
