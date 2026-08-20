FROM public.ecr.aws/lambda/python:3.13

COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv
COPY pyproject.toml uv.lock ./
RUN uv export --frozen --no-dev --no-emit-project --output-file requirements.txt \
    && uv pip install --system --requirements requirements.txt

COPY app ./app
COPY migrations ./migrations
COPY alembic.ini ./

CMD ["app.main.handler"]
