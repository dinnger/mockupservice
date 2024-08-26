# pip install "python-socketio[client]"
import socketio
import argparse



def get_arguments():
    parser = argparse.ArgumentParser(description="foo")
    parser.add_argument("--configfile", required=True)
    parser.add_argument("--port", required=True)
    parser.add_argument("--path", required=True)
    return parser.parse_args()


args = get_arguments()
module_name = f'{args.configfile}'
print(module_name)
print(args.port)
print(args.path)



sio = socketio.Client()

@sio.event
def connect():
  print("I'm connected!")

  def emit(data):
    sio.emit('client', data)

  
  # importar dinamicamente y Ejecutar main en el archvo test.py
 
  
  file = open(module_name, "rb").read()
  exec(compile(file, module_name, 'exec'), {"emit": emit,"sio":sio})
  
  
  # main(io=sio)


@sio.event
def connect_error(data):
  print("The connection failed!")


@sio.event
def disconnect():
  print("I'm disconnected!")
  exit(1)


sio.connect(f'http://localhost:{args.port}', socketio_path=args.path)
sio.wait()
