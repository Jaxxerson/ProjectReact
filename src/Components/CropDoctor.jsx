import React, { useState } from 'react'
import axios from 'axios'
import API_BASE_URL, { authConfig } from '../api'
import NotificationToast from './NotificationToast'

const imageLinks = (plantType, diseaseName) => {
  const query = encodeURIComponent(`${plantType} ${diseaseName} plant disease`)
  return [
    { label: "Google Images", url: `https://www.google.com/search?tbm=isch&q=${query}` },
    { label: "Wikimedia Commons", url: `https://commons.wikimedia.org/w/index.php?search=${query}&title=Special:MediaSearch&type=image` },
    { label: "PlantVillage Search", url: `https://plantvillage.psu.edu/search?utf8=%E2%9C%93&q=${query}` },
  ]
}

const localDiagnosis = (plantType, symptoms) => {
  const plant = plantType.toLowerCase()
  const symptomText = symptoms.toLowerCase()
  const tomatoDiseases = [
    {
      name: "Early blight",
      likelihood: "medium",
      why: "Common on tomatoes when lower leaves show brown spots, yellowing, or ring-like marks after humid weather.",
      treatment: "Remove badly affected lower leaves, avoid overhead watering, mulch soil splash, and use a copper or mancozeb fungicide according to label directions.",
      prevention: "Rotate tomatoes, space plants for airflow, stake vines, and remove old plant debris.",
      urgency: "Act within a few days if spots are spreading.",
    },
    {
      name: "Bacterial spot",
      likelihood: symptomText.includes("spot") ? "medium" : "low",
      why: "Small dark leaf spots and scabby fruit spots can point to bacterial disease in warm wet conditions.",
      treatment: "Remove infected leaves, avoid working plants while wet, and apply a copper-based protectant where locally recommended.",
      prevention: "Use clean seedlings, avoid overhead irrigation, and disinfect tools.",
      urgency: "Act quickly if rain splash is spreading symptoms.",
    },
  ]
  const bananaDiseases = [
    {
      name: "Black Sigatoka",
      likelihood: "medium",
      why: "Bananas with streaks, dark leaf spots, and drying leaf patches often fit Sigatoka leaf spot disease.",
      treatment: "Remove heavily infected leaves, improve airflow, control weeds, and use locally approved fungicide programs if pressure is high.",
      prevention: "Plant tolerant varieties, keep spacing open, and remove old infected leaf material.",
      urgency: "Act early because yield drops when many leaves are damaged.",
    },
    {
      name: "Fusarium wilt",
      likelihood: symptomText.includes("wilt") || symptomText.includes("yellow") ? "medium" : "low",
      why: "Yellowing older leaves, wilting, and internal stem discoloration can suggest Fusarium wilt.",
      treatment: "There is no reliable cure for infected banana mats. Remove infected plants carefully and avoid moving contaminated soil.",
      prevention: "Use clean planting material, resistant varieties, and strict tool sanitation.",
      urgency: "High if wilting is severe or spreading between mats.",
    },
  ]
  const generalDiseases = [
    {
      name: "Fungal leaf spot or blight",
      likelihood: "medium",
      why: "Spots, yellowing, or leaf drying are often caused by fungal leaf diseases, especially in wet or humid conditions.",
      treatment: "Remove badly infected leaves, water at soil level, improve airflow, and use a crop-appropriate fungicide if symptoms keep spreading.",
      prevention: "Avoid overcrowding, rotate crops, remove debris, and inspect plants weekly.",
      urgency: "Medium. Act sooner if symptoms spread plant to plant.",
    },
    {
      name: "Nutrient, water, or root stress",
      likelihood: "possible",
      why: "Yellowing and wilting can also come from overwatering, drought, root damage, or nutrient imbalance.",
      treatment: "Check soil moisture, drainage, root health, and recent fertilizer history before applying chemicals.",
      prevention: "Keep watering consistent and test soil when possible.",
      urgency: "Medium if wilting continues after watering is corrected.",
    },
  ]

  const possibleDiseases = plant.includes("tomato")
    ? tomatoDiseases
    : plant.includes("banana")
      ? bananaDiseases
      : generalDiseases

  return {
    plant_type: plantType,
    symptoms,
    summary: "This is preliminary crop guidance from symptom patterns. Confirm with a local extension officer before heavy pesticide or fungicide use.",
    possible_diseases: possibleDiseases.map((disease) => ({
      ...disease,
      images: [],
      image_links: imageLinks(plantType, disease.name),
    })),
    immediate_steps: [
      "Take clear photos of the top and underside of affected leaves.",
      "Mark affected plants so you can track spread.",
      "Avoid overhead watering until the issue is clearer.",
      "Remove only the worst affected leaves and dispose of them away from the field.",
    ],
    when_to_call_expert: "Call an agricultural extension officer if plants wilt rapidly, fruit is affected, stems rot, or symptoms spread after first treatment.",
    source: "local",
  }
}

const CropDoctor = () => {
  const [plantType, setPlantType] = useState("")
  const [symptoms, setSymptoms] = useState("")
  const [diagnosis, setDiagnosis] = useState(null)
  const [message, setMessage] = useState("")
  const [isChecking, setIsChecking] = useState(false)

  const diagnose = async (e) => {
    e.preventDefault()
    const token = localStorage.getItem("token")
    if (!token) {
      setMessage("Please sign in before using AI crop diagnosis.")
      return
    }

    try {
      setIsChecking(true)
      const formData = new FormData()
      formData.append("plant_type", plantType)
      formData.append("symptoms", symptoms)
      const response = await axios.post(`${API_BASE_URL}/crop_diagnosis`, formData, authConfig(token))
      setDiagnosis(response.data)
      setMessage(response.data.source === "openai" ? "AI diagnosis ready" : "Diagnosis ready using local fallback guidance")
    } catch (error) {
      setDiagnosis(localDiagnosis(plantType, symptoms))
      setMessage("The live AI route is not reachable, so Shamba Smart used local crop guidance for now.")
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <main className="page-dark dashboard-shell crop-doctor-page">
      <section className="crop-doctor-hero dashboard-card">
        <div>
          <p className="dashboard-kicker">AI crop doctor</p>
          <h1>Describe the symptoms. Get a practical disease check.</h1>
          <p>Tell Shamba Smart the crop type and what you are seeing on the leaves, stems, roots, or fruit. The diagnosis is a first step, not a lab test.</p>
        </div>
      </section>

      <section className="crop-doctor-layout">
        <form className="dashboard-card crop-doctor-form" onSubmit={diagnose}>
          <label>
            <span>Plant type</span>
            <input
              className="form-control"
              placeholder="Tomato, banana, maize..."
              required
              value={plantType}
              onChange={(e) => setPlantType(e.target.value)}
            />
          </label>

          <label>
            <span>Symptoms</span>
            <textarea
              className="form-control"
              placeholder="Yellow leaves, brown spots, wilting even after watering, fruit rotting..."
              required
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
            ></textarea>
          </label>

          <button className="btn btn-success" disabled={isChecking}>
            {isChecking ? "Checking..." : "Diagnose Crop"}
          </button>
        </form>

        <section className="crop-doctor-results">
          {!diagnosis && (
            <div className="dashboard-card crop-doctor-empty">
              <h2>Diagnosis results will appear here</h2>
              <p>Include where the symptom appears, how fast it spread, recent weather, and whether nearby plants look the same.</p>
            </div>
          )}

          {diagnosis && (
            <>
              <article className="dashboard-card crop-doctor-summary">
                <p className="dashboard-kicker">{diagnosis.plant_type}</p>
                <h2>{diagnosis.summary}</h2>
                <div>
                  {(diagnosis.immediate_steps || []).map((step) => <span key={step}>{step}</span>)}
                </div>
                <p>{diagnosis.when_to_call_expert}</p>
              </article>

              {(diagnosis.possible_diseases || []).map((disease) => (
                <article className="dashboard-card disease-card" key={disease.name}>
                  <div className="disease-card-header">
                    <div>
                      <p className="dashboard-kicker">{disease.likelihood}</p>
                      <h2>{disease.name}</h2>
                    </div>
                    <span>{disease.urgency}</span>
                  </div>

                  <p>{disease.why}</p>
                  <div className="disease-guidance">
                    <div>
                      <h3>Treatment</h3>
                      <p>{disease.treatment}</p>
                    </div>
                    <div>
                      <h3>Prevention</h3>
                      <p>{disease.prevention}</p>
                    </div>
                  </div>

                  {disease.images?.length > 0 && (
                    <div className="disease-images">
                      {disease.images.map((image) => (
                        <a href={image.source_url} target="_blank" rel="noreferrer" key={image.url}>
                          <img src={image.url} alt={image.title} />
                        </a>
                      ))}
                    </div>
                  )}

                  <div className="disease-links">
                    {(disease.image_links || []).map((link) => (
                      <a className="btn btn-outline-light" href={link.url} target="_blank" rel="noreferrer" key={link.url}>{link.label}</a>
                    ))}
                  </div>
                </article>
              ))}
            </>
          )}
        </section>
      </section>

      <NotificationToast message={message} onClose={() => setMessage("")} />
    </main>
  )
}

export default CropDoctor
