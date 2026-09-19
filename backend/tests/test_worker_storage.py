import pytest
from app.workers.job_worker import JobWorker
from app.services.storage.s3_adapter import S3StorageProvider
from app.models.job import Job, JobStatus

@pytest.mark.asyncio
async def test_job_worker(client, db_session):
    # 1. Test kullanıcısı oluştur
    reg_res = client.post(
        "/api/v1/users/",
        json={"email": "worker_user@example.com", "password": "password123"}
    )
    user_id = reg_res.json()["id"]

    # 2. Mock provider ile PENDING durumunda iş oluştur
    job = Job(
        user_id=user_id,
        prompt="Worker testi için prompt",
        provider="mock",
        model_name="mock-model",
        status=JobStatus.PENDING
    )
    db_session.add(job)
    db_session.commit()

    # 3. JobWorker tek geçiş çalıştır (test db oturumu ile)
    worker = JobWorker()
    processed_count = await worker.run_once(db=db_session)
    assert processed_count == 1
    
    # 4. İşlemin tamamlandığını doğrula
    updated_job = db_session.query(Job).filter(Job.id == job.id).first()
    assert updated_job.status == JobStatus.COMPLETED
    assert "[MOCK AI" in updated_job.response

def test_s3_storage_provider(tmp_path):
    storage = S3StorageProvider(upload_dir=str(tmp_path))
    file_bytes = b"Test file content"
    file_name = "sample.txt"
    
    url = storage.upload_file(file_name, file_bytes)
    assert url == "/uploads/sample.txt"
    assert (tmp_path / "sample.txt").exists()
    assert (tmp_path / "sample.txt").read_bytes() == b"Test file content"

def test_request_id_middleware(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert "x-request-id" in response.headers
    assert "x-process-time-ms" in response.headers
    data = response.json()
    assert data["checks"]["database"] == "healthy"
