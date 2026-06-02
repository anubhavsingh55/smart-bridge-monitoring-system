FROM python:3.12-slim

WORKDIR /app

COPY simulator/requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY simulator .

COPY cleaned_dataset ./cleaned_dataset

CMD ["python", "iot_simulator.py"]