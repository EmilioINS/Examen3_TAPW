import { useState, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronRight, faChevronLeft, faStar, faCircleNotch } from '@fortawesome/free-solid-svg-icons'
import { useStudent } from '../contexts/StudentContext'
import {
  syncWithLocalBackend,
  getTeachers,
  type Teacher,
  getTeacherReviews,
  type Review,
  createReview,
  getSubjects,
  type Subject
} from '../services/localApi'
import Navbar from '../components/Navbar'
import './Resenas.css'

export default function Resenas() {
  const { student } = useStudent()
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loadingTeachers, setLoadingTeachers] = useState(true)
  const [subjects, setSubjects] = useState<Subject[]>([])
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5
  
  // Selection & Reviews
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loadingReviews, setLoadingReviews] = useState(false)
  
  // Form
  const [formSubject, setFormSubject] = useState('')
  const [formPeriod, setFormPeriod] = useState('')
  const [formRating, setFormRating] = useState('5')
  const [formComment, setFormComment] = useState('')
  const [formStatus, setFormStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message?: string }>({ type: 'idle' })

  // Initialize
  useEffect(() => {
    async function init() {
      try {
        if (student?.email) {
          await syncWithLocalBackend(student.email)
        }
        const [teachersData, subjectsData] = await Promise.all([
          getTeachers(),
          getSubjects().catch(() => []) // Fallback in case subjects endpoint doesn't exist
        ])
        setTeachers(teachersData)
        setSubjects(subjectsData)
      } catch (err) {
        console.error('Error loading data', err)
      } finally {
        setLoadingTeachers(false)
      }
    }
    init()
  }, [student])

  // Load reviews when a teacher is selected
  useEffect(() => {
    if (!selectedTeacher) return
    
    let isMounted = true
    setLoadingReviews(true)
    setReviews([])
    setFormStatus({ type: 'idle' })
    
    getTeacherReviews(selectedTeacher.id)
      .then(data => {
        if (isMounted) setReviews(data)
      })
      .catch(err => console.error(err))
      .finally(() => {
        if (isMounted) setLoadingReviews(false)
      })
      
    return () => { isMounted = false }
  }, [selectedTeacher])

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentTeachers = teachers.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(teachers.length / itemsPerPage)

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  // Submit Review
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTeacher) return
    
    if (!formSubject || !formPeriod) {
      setFormStatus({ type: 'error', message: 'Por favor completa materia y periodo.' })
      return
    }

    setFormStatus({ type: 'loading' })
    try {
      const res = await createReview({
        teacher_id: selectedTeacher.id,
        subject_id: formSubject,
        period_id: formPeriod,
        rating: Number(formRating),
        comment: formComment
      })
      setFormStatus({ type: 'success', message: res.message || 'Reseña enviada correctamente.' })
      // Reset form fields
      setFormSubject('')
      setFormPeriod('')
      setFormRating('5')
      setFormComment('')
    } catch (err: any) {
      setFormStatus({ type: 'error', message: err.message || 'Error al enviar la reseña.' })
    }
  }

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <FontAwesomeIcon key={i} icon={faStar} color={i < rating ? '#fbbf24' : 'rgba(255,255,255,0.2)'} />
    ))
  }

  return (
    <div className="resenas-root">
      <div className="resenas-bg">
        <div className="resenas-bg__img" />
        <div className="resenas-bg__overlay" />
      </div>

      <Navbar />

      <main className="resenas-content">
        <div className="resenas-header">
          <h1>Reseñas Académicas</h1>
          <p>Consulta o comparte tu experiencia con los profesores de la institución.</p>
        </div>

        <div className="resenas-grid">
          {/* Teachers List Column */}
          <div className="teachers-card glass">
            <h2>Profesores</h2>
            
            {loadingTeachers ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <FontAwesomeIcon icon={faCircleNotch} spin size="2x" color="rgba(255,255,255,0.5)" />
              </div>
            ) : teachers.length === 0 ? (
              <p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>No se encontraron profesores.</p>
            ) : (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {currentTeachers.map(teacher => (
                    <div 
                      key={teacher.id} 
                      className={`teacher-item ${selectedTeacher?.id === teacher.id ? 'active' : ''}`}
                      onClick={() => setSelectedTeacher(teacher)}
                    >
                      <div className="teacher-info">
                        <span className="teacher-name">{teacher.name}</span>
                        <span className="teacher-dept">{teacher.department}</span>
                      </div>
                      <FontAwesomeIcon icon={faChevronRight} className="teacher-arrow" />
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="pagination">
                    <button 
                      className="pagination-btn" 
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <FontAwesomeIcon icon={faChevronLeft} />
                    </button>
                    <span className="pagination-info">{currentPage} / {totalPages}</span>
                    <button 
                      className="pagination-btn" 
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <FontAwesomeIcon icon={faChevronRight} />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Details / Reviews Column */}
          <div className="reviews-panel glass">
            {!selectedTeacher ? (
              <div className="reviews-empty">
                Selecciona un profesor para ver sus reseñas.
              </div>
            ) : (
              <>
                <h2>Reseñas de {selectedTeacher.name}</h2>
                
                {loadingReviews ? (
                   <div style={{ textAlign: 'center', padding: '40px 0' }}>
                     <FontAwesomeIcon icon={faCircleNotch} spin size="2x" color="rgba(255,255,255,0.5)" />
                   </div>
                ) : reviews.length === 0 ? (
                  <div className="reviews-empty" style={{ padding: '20px 0' }}>
                    Aún no hay reseñas aprobadas para este profesor. ¡Sé el primero!
                  </div>
                ) : (
                  <div className="reviews-list">
                    {reviews.map(review => (
                      <div key={review.id} className="review-item">
                        <div className="review-header">
                          <span className="review-subject">{review.subjects?.name || 'Materia'}</span>
                          <span className="review-stars">{renderStars(review.rating)}</span>
                        </div>
                        <div className="review-period">Periodo: {review.period_id}</div>
                        {review.comment && <p className="review-comment">"{review.comment}"</p>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Form to add a new review */}
                <form className="review-form" onSubmit={handleSubmit}>
                  <h3 style={{ margin: '0 0 10px', fontSize: '18px' }}>Deja tu reseña</h3>
                  
                  {formStatus.type === 'success' && (
                    <div className="form-success">{formStatus.message}</div>
                  )}
                  {formStatus.type === 'error' && (
                    <div className="form-error">{formStatus.message}</div>
                  )}
                  
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label>Materia</label>
                      {subjects.length > 0 ? (
                        <select value={formSubject} onChange={e => setFormSubject(e.target.value)} required>
                          <option value="" disabled>Selecciona una materia</option>
                          {subjects.map(s => (
                            <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                          ))}
                        </select>
                      ) : (
                        <input 
                          type="text" 
                          placeholder="ID de Materia (Ej. UUID)" 
                          value={formSubject} 
                          onChange={e => setFormSubject(e.target.value)}
                          required 
                        />
                      )}
                    </div>
                    <div className="form-group" style={{ width: '120px' }}>
                      <label>Periodo</label>
                      <input 
                        type="text" 
                        placeholder="Ej: 2023/1" 
                        value={formPeriod} 
                        onChange={e => setFormPeriod(e.target.value)}
                        required 
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Calificación (Estrellas)</label>
                    <select value={formRating} onChange={e => setFormRating(e.target.value)}>
                      <option value="5">5 - Excelente</option>
                      <option value="4">4 - Muy bueno</option>
                      <option value="3">3 - Regular</option>
                      <option value="2">2 - Malo</option>
                      <option value="1">1 - Pésimo</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Comentario (Opcional)</label>
                    <textarea 
                      rows={3} 
                      placeholder="Comparte detalles de tu experiencia..."
                      value={formComment}
                      onChange={e => setFormComment(e.target.value)}
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="submit-btn" 
                    disabled={formStatus.type === 'loading'}
                  >
                    {formStatus.type === 'loading' ? <FontAwesomeIcon icon={faCircleNotch} spin /> : 'Enviar Reseña'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
