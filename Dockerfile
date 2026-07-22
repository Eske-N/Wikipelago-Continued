FROM python:3.12-slim

WORKDIR /app

COPY bridge/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY bridge /app/bridge
COPY web /app/web

ENV PORT=5000
EXPOSE 5000

CMD ["python", "bridge/bridge.py", "--host", "0.0.0.0"]
