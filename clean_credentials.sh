#!/bin/bash
if [ -f app.py ]; then
    sed -i.bak 's/AKIAXU4IMYLWFUY3QPM7/your_access_key_here/g' app.py
    sed -i.bak 's/ipyzeIBiXAdGvlLYsluz5UJFERW8N8Z9xL\/SQQGm/your_secret_key_here/g' app.py
    rm -f app.py.bak
fi
