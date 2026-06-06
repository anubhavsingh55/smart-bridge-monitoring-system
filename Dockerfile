FROM python:3.12

WORKDIR /app

COPY . .

RUN pip install pandas numpy matplotlib requests
CMD ["python", "simulator/iot_simulator.py"]