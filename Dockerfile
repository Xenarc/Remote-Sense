FROM jupyter/base-notebook

COPY requirements.txt requirements.txt

RUN pip install -r requirements.txt
